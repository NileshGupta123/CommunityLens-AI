from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, AQIReading
from app.schemas import ForecastOut, ForecastPoint
from app.services.forecast_service import forecast_next_hours

router = APIRouter(prefix="/predict", tags=["predict"])


@router.get("/aqi/{area_id}", response_model=ForecastOut)
async def predict_aqi(area_id: int, hours: int = 6, db: AsyncSession = Depends(get_db)):
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    area = area_result.scalar_one_or_none()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    history_result = await db.execute(
        select(AQIReading)
        .where(AQIReading.area_id == area_id)
        .order_by(AQIReading.recorded_at.asc())
    )
    readings = list(history_result.scalars().all())

    if not readings:
        raise HTTPException(status_code=404, detail="No AQI history for this area")

    values = [r.aqi_value for r in readings]
    predictions, trend = forecast_next_hours(values, hours_ahead=hours)

    forecast_points = [
        ForecastPoint(hours_ahead=i + 1, predicted_value=val)
        for i, val in enumerate(predictions)
    ]

    return ForecastOut(
        area_name=area.name,
        metric="aqi",
        current_value=values[-1],
        forecast=forecast_points,
        trend=trend,
    )