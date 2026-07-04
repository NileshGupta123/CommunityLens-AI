from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Area(Base):
    """A neighbourhood / zone in the city that all other data is tied to."""
    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    aqi_readings: Mapped[list["AQIReading"]] = relationship(back_populates="area")
    traffic_readings: Mapped[list["TrafficReading"]] = relationship(back_populates="area")
    hospitals: Mapped[list["Hospital"]] = relationship(back_populates="area")


class AQIReading(Base):
    """Air quality snapshot for an area at a point in time."""
    __tablename__ = "aqi_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"))
    aqi_value: Mapped[float] = mapped_column(Float)
    pm25: Mapped[float] = mapped_column(Float)
    pm10: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    area: Mapped["Area"] = relationship(back_populates="aqi_readings")


class TrafficReading(Base):
    """Traffic congestion snapshot for an area at a point in time."""
    __tablename__ = "traffic_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"))
    congestion_level: Mapped[str] = mapped_column(String(20))  # low / moderate / high / severe
    avg_speed_kmph: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    area: Mapped["Area"] = relationship(back_populates="traffic_readings")


class Hospital(Base):
    """Hospital located in an area, with current occupancy status."""
    __tablename__ = "hospitals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"))
    name: Mapped[str] = mapped_column(String(150))
    total_beds: Mapped[int] = mapped_column(Integer)
    beds_available: Mapped[int] = mapped_column(Integer)
    occupancy_percent: Mapped[float] = mapped_column(Float)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    area: Mapped["Area"] = relationship(back_populates="hospitals")