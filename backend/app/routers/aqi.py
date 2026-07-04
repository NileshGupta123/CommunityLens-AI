from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, AQIReading
from app.schemas import AQIReadingOut
from app.services.openaq_service import get_live_aqi

router = APIRouter(prefix="/aqi", tags=["aqi"])


@router.get("/latest", response_model=list[AQIReadingOut])
async def get_latest_aqi_all_areas(db: AsyncSession = Depends(get_db)):
    """Latest AQI reading for every area — used to color the map."""
    areas_result = await db.execute(select(Area))
    areas = areas_result.scalars().all()

    latest_readings = []
    for area in areas:
        result = await db.execute(
            select(AQIReading)
            .where(AQIReading.area_id == area.id)
            .order_by(AQIReading.recorded_at.desc())
            .limit(1)
        )
        reading = result.scalar_one_or_none()
        if reading:
            latest_readings.append(reading)

    return latest_readings


@router.get("/history/{area_id}", response_model=list[AQIReadingOut])
async def get_aqi_history(area_id: int, db: AsyncSession = Depends(get_db)):
    """Full 24h AQI history for one area — used for the trend chart."""
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    if not area_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Area not found")

    result = await db.execute(
        select(AQIReading)
        .where(AQIReading.area_id == area_id)
        .order_by(AQIReading.recorded_at.asc())
    )
    return list(result.scalars().all())


@router.get("/live/{area_id}")
async def get_live_aqi_for_area(area_id: int, db: AsyncSession = Depends(get_db)):
    """
    Try to fetch real live AQI from the nearest OpenAQ station.
    Falls back to the latest simulated reading if no live station is found nearby.
    """
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    area = area_result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    live_data = await get_live_aqi(area.latitude, area.longitude)
    if live_data:
        return {
            "area_name": area.name,
            "aqi_value": live_data["aqi_value"],
            "pm25": live_data["pm25"],
            "source": f"live: {live_data['source_station']}",
        }

    # Fallback to simulated data
    fallback_result = await db.execute(
        select(AQIReading)
        .where(AQIReading.area_id == area_id)
        .order_by(AQIReading.recorded_at.desc())
        .limit(1)
    )
    fallback = fallback_result.scalar_one_or_none()
    if not fallback:
        raise HTTPException(status_code=404, detail="No AQI data available for this area")

    return {
        "area_name": area.name,
        "aqi_value": fallback.aqi_value,
        "pm25": fallback.pm25,
        "source": "simulated (no live station within range)",
    }