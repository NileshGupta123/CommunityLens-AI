from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, AQIReading, TrafficReading, Hospital
from app.schemas import ReportOut
from app.services.groq_service import generate_area_report
from app.routers.decision import _get_area_decision

router = APIRouter(prefix="/report", tags=["report"])


@router.get("/{area_id}", response_model=ReportOut)
async def get_area_report(area_id: int, db: AsyncSession = Depends(get_db)):
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    area = area_result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    aqi_result = await db.execute(
        select(AQIReading).where(AQIReading.area_id == area_id)
        .order_by(AQIReading.recorded_at.desc()).limit(1)
    )
    latest_aqi = aqi_result.scalar_one_or_none()

    traffic_result = await db.execute(
        select(TrafficReading).where(TrafficReading.area_id == area_id)
        .order_by(TrafficReading.recorded_at.desc()).limit(1)
    )
    latest_traffic = traffic_result.scalar_one_or_none()

    hospitals_result = await db.execute(select(Hospital).where(Hospital.area_id == area_id))
    hospitals = list(hospitals_result.scalars().all())

    decision = await _get_area_decision(area, db)

    stats = {
        "aqi_value": latest_aqi.aqi_value if latest_aqi else 0,
        "pm25": latest_aqi.pm25 if latest_aqi else 0,
        "pm10": latest_aqi.pm10 if latest_aqi else 0,
        "congestion_level": latest_traffic.congestion_level if latest_traffic else "unknown",
        "avg_speed_kmph": latest_traffic.avg_speed_kmph if latest_traffic else 0,
        "total_hospitals": len(hospitals),
        "beds_available": sum(h.beds_available for h in hospitals),
        "risk_score": decision.risk_score,
        "risk_category": decision.risk_category,
    }

    try:
        narrative = generate_area_report(area.name, stats)
    except Exception:
        narrative = (
            f"{area.name} currently has an AQI of {stats['aqi_value']} and "
            f"{stats['congestion_level']} traffic conditions. "
            f"{stats['beds_available']} hospital beds are available nearby. "
            f"Overall risk is assessed as {stats['risk_category']}."
        )

    return ReportOut(
        area_name=area.name,
        generated_at=datetime.utcnow().isoformat(),
        narrative=narrative,
        **stats,
    )