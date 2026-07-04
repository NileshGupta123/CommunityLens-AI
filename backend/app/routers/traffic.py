from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, TrafficReading
from app.schemas import TrafficReadingOut

router = APIRouter(prefix="/traffic", tags=["traffic"])


@router.get("/latest", response_model=list[TrafficReadingOut])
async def get_latest_traffic_all_areas(db: AsyncSession = Depends(get_db)):
    """Latest traffic reading for every area — used to color the map."""
    areas_result = await db.execute(select(Area))
    areas = areas_result.scalars().all()

    latest_readings = []
    for area in areas:
        result = await db.execute(
            select(TrafficReading)
            .where(TrafficReading.area_id == area.id)
            .order_by(TrafficReading.recorded_at.desc())
            .limit(1)
        )
        reading = result.scalar_one_or_none()
        if reading:
            latest_readings.append(reading)

    return latest_readings


@router.get("/history/{area_id}", response_model=list[TrafficReadingOut])
async def get_traffic_history(area_id: int, db: AsyncSession = Depends(get_db)):
    """Full 24h traffic history for one area — used for the trend chart."""
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    if not area_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Area not found")

    result = await db.execute(
        select(TrafficReading)
        .where(TrafficReading.area_id == area_id)
        .order_by(TrafficReading.recorded_at.asc())
    )
    return list(result.scalars().all())