from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, AQIReading, TrafficReading, Hospital
from app.schemas import DecisionOut
from app.services.groq_service import summarize_decision

router = APIRouter(prefix="/decision", tags=["decision"])

CONGESTION_SCORE = {"low": 0, "moderate": 25, "high": 60, "severe": 90}


def _aqi_to_score(aqi_value: float) -> float:
    """Map AQI (0-500 scale) to a 0-100 risk contribution."""
    return min(100.0, (aqi_value / 300) * 100)


def _hospital_pressure_score(hospitals: list[Hospital]) -> float:
    if not hospitals:
        return 0.0
    avg_occupancy = sum(h.occupancy_percent for h in hospitals) / len(hospitals)
    return avg_occupancy


def _risk_category(score: float) -> str:
    if score < 30:
        return "Low"
    elif score < 55:
        return "Moderate"
    elif score < 75:
        return "High"
    return "Severe"


def _build_recommendations(aqi_value: float, congestion_level: str, hospitals: list[Hospital]) -> list[str]:
    recs = []

    if aqi_value >= 150:
        recs.append("Avoid outdoor activity; consider working from home")
        recs.append("Wear an N95 mask if you must go outside")
    elif aqi_value >= 100:
        recs.append("Sensitive groups should limit prolonged outdoor exposure")

    if congestion_level in ("high", "severe"):
        recs.append("Avoid this route during current hours; use an alternate path")

    overcrowded = [h for h in hospitals if h.occupancy_percent >= 85]
    if overcrowded:
        available = [h for h in hospitals if h.occupancy_percent < 85]
        if available:
            recs.append(f"For medical needs, prefer {available[0].name} over overcrowded facilities")
        else:
            recs.append("All nearby hospitals are near capacity — expect longer wait times")

    if not recs:
        recs.append("Conditions are currently normal — no special precautions needed")

    return recs


async def _get_area_decision(area: Area, db: AsyncSession) -> DecisionOut:
    aqi_result = await db.execute(
        select(AQIReading)
        .where(AQIReading.area_id == area.id)
        .order_by(AQIReading.recorded_at.desc())
        .limit(1)
    )
    latest_aqi = aqi_result.scalar_one_or_none()

    traffic_result = await db.execute(
        select(TrafficReading)
        .where(TrafficReading.area_id == area.id)
        .order_by(TrafficReading.recorded_at.desc())
        .limit(1)
    )
    latest_traffic = traffic_result.scalar_one_or_none()

    hospitals_result = await db.execute(select(Hospital).where(Hospital.area_id == area.id))
    hospitals = list(hospitals_result.scalars().all())

    aqi_value = latest_aqi.aqi_value if latest_aqi else 0
    congestion_level = latest_traffic.congestion_level if latest_traffic else "low"

    aqi_score = _aqi_to_score(aqi_value)
    traffic_score = CONGESTION_SCORE.get(congestion_level, 0)
    hospital_score = _hospital_pressure_score(hospitals)

    risk_score = round((aqi_score * 0.5) + (traffic_score * 0.3) + (hospital_score * 0.2), 1)
    risk_category = _risk_category(risk_score)
    recommendations = _build_recommendations(aqi_value, congestion_level, hospitals)

    try:
        ai_summary = summarize_decision(area.name, risk_score, risk_category, recommendations)
    except Exception:
        ai_summary = f"{area.name} is currently at {risk_category.lower()} risk based on air quality, traffic, and hospital capacity."

    return DecisionOut(
        area_name=area.name,
        risk_score=risk_score,
        risk_category=risk_category,
        recommendations=recommendations,
        ai_summary=ai_summary,
    )


@router.get("/{area_id}", response_model=DecisionOut)
async def get_decision(area_id: int, db: AsyncSession = Depends(get_db)):
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    area = area_result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    return await _get_area_decision(area, db)


@router.get("", response_model=list[DecisionOut])
async def get_all_decisions(db: AsyncSession = Depends(get_db)):
    """Decision intelligence for every area, sorted worst-risk first — powers the alerts feed."""
    areas_result = await db.execute(select(Area))
    areas = list(areas_result.scalars().all())

    decisions = [await _get_area_decision(area, db) for area in areas]
    decisions.sort(key=lambda d: d.risk_score, reverse=True)
    return decisions