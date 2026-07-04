from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, AQIReading, TrafficReading, Hospital
from app.schemas import DashboardOut, AreaSummary, AreaOut, AQIReadingOut, TrafficReadingOut, HospitalOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Lower avg_speed_kmph = worse congestion, so we rank by minimum speed
CONGESTION_RANK = {"low": 0, "moderate": 1, "high": 2, "severe": 3}


async def _latest_aqi(db: AsyncSession, area_id: int) -> AQIReading | None:
    result = await db.execute(
        select(AQIReading)
        .where(AQIReading.area_id == area_id)
        .order_by(AQIReading.recorded_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _latest_traffic(db: AsyncSession, area_id: int) -> TrafficReading | None:
    result = await db.execute(
        select(TrafficReading)
        .where(TrafficReading.area_id == area_id)
        .order_by(TrafficReading.recorded_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _hospitals_for_area(db: AsyncSession, area_id: int) -> list[Hospital]:
    result = await db.execute(select(Hospital).where(Hospital.area_id == area_id))
    return list(result.scalars().all())


@router.get("", response_model=DashboardOut)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    areas_result = await db.execute(select(Area))
    areas = list(areas_result.scalars().all())

    area_summaries: list[AreaSummary] = []
    aqi_values: list[float] = []
    worst_aqi_area_name = ""
    worst_aqi_value = -1.0
    most_congested_area_name = ""
    worst_congestion_rank = -1
    total_beds_available = 0

    for area in areas:
        latest_aqi = await _latest_aqi(db, area.id)
        latest_traffic = await _latest_traffic(db, area.id)
        hospitals = await _hospitals_for_area(db, area.id)

        area_summaries.append(AreaSummary(
            area=AreaOut.model_validate(area),
            latest_aqi=AQIReadingOut.model_validate(latest_aqi) if latest_aqi else None,
            latest_traffic=TrafficReadingOut.model_validate(latest_traffic) if latest_traffic else None,
            hospitals=[HospitalOut.model_validate(h) for h in hospitals],
        ))

        if latest_aqi:
            aqi_values.append(latest_aqi.aqi_value)
            if latest_aqi.aqi_value > worst_aqi_value:
                worst_aqi_value = latest_aqi.aqi_value
                worst_aqi_area_name = area.name

        if latest_traffic:
            rank = CONGESTION_RANK.get(latest_traffic.congestion_level, 0)
            if rank > worst_congestion_rank:
                worst_congestion_rank = rank
                most_congested_area_name = area.name

        total_beds_available += sum(h.beds_available for h in hospitals)

    city_avg_aqi = round(sum(aqi_values) / len(aqi_values), 1) if aqi_values else 0.0

    return DashboardOut(
        areas=area_summaries,
        city_avg_aqi=city_avg_aqi,
        worst_aqi_area=worst_aqi_area_name,
        most_congested_area=most_congested_area_name,
        total_beds_available=total_beds_available,
    )