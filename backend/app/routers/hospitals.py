from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Area, Hospital
from app.schemas import HospitalOut

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


@router.get("", response_model=list[HospitalOut])
async def get_all_hospitals(db: AsyncSession = Depends(get_db)):
    """All hospitals across the city — used for the map markers."""
    result = await db.execute(select(Hospital))
    return list(result.scalars().all())


@router.get("/area/{area_id}", response_model=list[HospitalOut])
async def get_hospitals_by_area(area_id: int, db: AsyncSession = Depends(get_db)):
    """Hospitals in one specific area."""
    area_result = await db.execute(select(Area).where(Area.id == area_id))
    if not area_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Area not found")

    result = await db.execute(select(Hospital).where(Hospital.area_id == area_id))
    return list(result.scalars().all())


@router.get("/overcrowded", response_model=list[HospitalOut])
async def get_overcrowded_hospitals(threshold: float = 85.0, db: AsyncSession = Depends(get_db)):
    """
    Hospitals above a given occupancy threshold (default 85%).
    Used to power alerts like 'which hospitals are overcrowded right now'.
    """
    result = await db.execute(
        select(Hospital)
        .where(Hospital.occupancy_percent >= threshold)
        .order_by(Hospital.occupancy_percent.desc())
    )
    return list(result.scalars().all())