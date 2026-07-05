from datetime import datetime
from pydantic import BaseModel


class AreaOut(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float

    class Config:
        from_attributes = True


class AQIReadingOut(BaseModel):
    id: int
    area_id: int
    aqi_value: float
    pm25: float
    pm10: float
    recorded_at: datetime

    class Config:
        from_attributes = True


class TrafficReadingOut(BaseModel):
    id: int
    area_id: int
    congestion_level: str
    avg_speed_kmph: float
    recorded_at: datetime

    class Config:
        from_attributes = True


class HospitalOut(BaseModel):
    id: int
    area_id: int
    name: str
    total_beds: int
    beds_available: int
    occupancy_percent: float
    updated_at: datetime

    class Config:
        from_attributes = True


class AreaSummary(BaseModel):
    """Combined current snapshot for one area — used by the dashboard and chat."""
    area: AreaOut
    latest_aqi: AQIReadingOut | None = None
    latest_traffic: TrafficReadingOut | None = None
    hospitals: list[HospitalOut] = []


class DashboardOut(BaseModel):
    """Full city snapshot across all areas — powers the main dashboard view."""
    areas: list[AreaSummary]
    city_avg_aqi: float
    worst_aqi_area: str
    most_congested_area: str
    total_beds_available: int


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    source: str  # "gemini" or "groq"


class DecisionOut(BaseModel):
    """A decision-intelligence recommendation chain for one area."""
    area_name: str
    risk_score: float          # 0-100, higher = worse
    risk_category: str         # Low / Moderate / High / Severe
    recommendations: list[str]  # rule-based action chain
    ai_summary: str            # natural-language explanation


class ForecastPoint(BaseModel):
    hours_ahead: int
    predicted_value: float


class ForecastOut(BaseModel):
    area_name: str
    metric: str  # "aqi"
    current_value: float
    forecast: list[ForecastPoint]
    trend: str  # "improving" / "worsening" / "stable"