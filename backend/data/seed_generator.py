"""
Seed generator for CommunityLens AI.

Populates the database with:
- 8 real Mumbai areas (with real lat/lon)
- 24 hours of historical AQI readings per area (hourly)
- 24 hours of historical traffic readings per area (hourly)
- 2-3 hospitals per area with realistic occupancy

Run with:  python -m data.seed_generator
(run from inside backend/, with venv active)
"""

import asyncio
import random
from datetime import datetime, timedelta

from app.db import AsyncSessionLocal, init_db
from app.models import Area, AQIReading, TrafficReading, Hospital

# Real Mumbai areas with approximate coordinates
MUMBAI_AREAS = [
    {"name": "Andheri West", "latitude": 19.1364, "longitude": 72.8296},
    {"name": "Bandra West", "latitude": 19.0596, "longitude": 72.8295},
    {"name": "Dadar", "latitude": 19.0178, "longitude": 72.8478},
    {"name": "Kandivali West", "latitude": 19.2033, "longitude": 72.8526},
    {"name": "Powai", "latitude": 19.1176, "longitude": 72.9060},
    {"name": "Borivali West", "latitude": 19.2307, "longitude": 72.8567},
    {"name": "Thane West", "latitude": 19.2183, "longitude": 72.9781},
    {"name": "Kurla", "latitude": 19.0728, "longitude": 72.8826},
]

CONGESTION_LEVELS = ["low", "moderate", "high", "severe"]

HOSPITAL_NAME_TEMPLATES = [
    "{area} General Hospital",
    "{area} Civic Hospital",
    "{area} Community Health Centre",
]


def _base_aqi_for_area(area_name: str) -> float:
    """Give each area a realistic baseline AQI so the data isn't uniform noise."""
    seed = sum(ord(c) for c in area_name)
    return 60 + (seed % 140)  # ranges roughly 60-200


def _congestion_for_hour(hour: int) -> tuple[str, float]:
    """Rush hours (8-11, 18-21) get worse congestion, night hours are freer."""
    if hour in (8, 9, 10, 18, 19, 20):
        level = random.choice(["high", "severe"])
        speed = random.uniform(8, 18)
    elif hour in (7, 11, 17, 21):
        level = random.choice(["moderate", "high"])
        speed = random.uniform(15, 28)
    elif 0 <= hour <= 5:
        level = "low"
        speed = random.uniform(35, 55)
    else:
        level = random.choice(["low", "moderate"])
        speed = random.uniform(25, 40)
    return level, round(speed, 1)


async def seed_if_empty():
    """
    Check if the areas table is empty and seed it if so.
    Called on every app startup — this makes the app self-healing on platforms
    like Render's free tier, where the SQLite file is wiped on every restart.
    """
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Area).limit(1))
        existing = result.scalar_one_or_none()
        if existing is not None:
            print("Database already has data — skipping seed.")
            return

    print("Database is empty — running seed...")
    await seed()


async def seed():
    await init_db()

    async with AsyncSessionLocal() as session:
        # 1. Create areas
        areas = []
        for area_data in MUMBAI_AREAS:
            area = Area(**area_data)
            session.add(area)
            areas.append(area)
        await session.flush()  # get area.id populated before using it below

        now = datetime.utcnow()

        # 2. Seed 24 hours of AQI + traffic readings per area
        for area in areas:
            base_aqi = _base_aqi_for_area(area.name)

            for hours_ago in range(24, 0, -1):
                timestamp = now - timedelta(hours=hours_ago)
                hour = timestamp.hour

                # AQI drifts randomly around the area's baseline
                aqi_value = max(15, base_aqi + random.uniform(-20, 20))
                pm25 = round(aqi_value * random.uniform(0.4, 0.6), 1)
                pm10 = round(aqi_value * random.uniform(0.6, 0.9), 1)

                session.add(AQIReading(
                    area_id=area.id,
                    aqi_value=round(aqi_value, 1),
                    pm25=pm25,
                    pm10=pm10,
                    recorded_at=timestamp,
                ))

                # Traffic follows a rush-hour pattern
                level, speed = _congestion_for_hour(hour)
                session.add(TrafficReading(
                    area_id=area.id,
                    congestion_level=level,
                    avg_speed_kmph=speed,
                    recorded_at=timestamp,
                ))

            # 3. Seed 2-3 hospitals per area
            num_hospitals = random.randint(2, 3)
            for i in range(num_hospitals):
                total_beds = random.choice([50, 80, 120, 200])
                occupancy = random.uniform(40, 98)
                available = max(0, int(total_beds * (1 - occupancy / 100)))

                session.add(Hospital(
                    area_id=area.id,
                    name=HOSPITAL_NAME_TEMPLATES[i % len(HOSPITAL_NAME_TEMPLATES)].format(area=area.name),
                    total_beds=total_beds,
                    beds_available=available,
                    occupancy_percent=round(occupancy, 1),
                    updated_at=now,
                ))

        await session.commit()
        print(f"Seeded {len(areas)} areas with 24h of AQI + traffic history and hospitals.")


if __name__ == "__main__":
    asyncio.run(seed())