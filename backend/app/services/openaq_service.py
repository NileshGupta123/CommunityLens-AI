import httpx

from app.config import settings

OPENAQ_BASE_URL = "https://api.openaq.org/v3"

# US EPA PM2.5 breakpoints: (conc_low, conc_high, aqi_low, aqi_high)
PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 350.4, 301, 400),
    (350.5, 500.4, 401, 500),
]


def _pm25_to_aqi(concentration: float) -> float:
    """Convert a PM2.5 concentration (µg/m³) to a US EPA AQI value."""
    for conc_low, conc_high, aqi_low, aqi_high in PM25_BREAKPOINTS:
        if conc_low <= concentration <= conc_high:
            return round(
                ((aqi_high - aqi_low) / (conc_high - conc_low)) * (concentration - conc_low) + aqi_low,
                1,
            )
    return 500.0  # cap at max if concentration is off the charts


async def get_live_aqi(latitude: float, longitude: float, radius_m: int = 25000) -> dict | None:
    """
    Try to find a real nearby air quality station and return its live AQI.
    Returns None if no API key configured, no station found, or the API call fails
    — callers should fall back to simulated data in that case.
    """
    if not settings.openaq_api_key:
        return None

    headers = {"X-API-Key": settings.openaq_api_key}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Step 1: find nearest station within radius
            locations_resp = await client.get(
                f"{OPENAQ_BASE_URL}/locations",
                headers=headers,
                params={
                    "coordinates": f"{latitude},{longitude}",
                    "radius": radius_m,
                    "limit": 1,
                    "order_by": "distance",
                },
            )
            locations_resp.raise_for_status()
            results = locations_resp.json().get("results", [])
            if not results:
                return None

            location_id = results[0]["id"]
            location_name = results[0].get("name", "Unknown station")

            # Step 2: get latest measurement from that station
            latest_resp = await client.get(
                f"{OPENAQ_BASE_URL}/locations/{location_id}/latest",
                headers=headers,
            )
            latest_resp.raise_for_status()
            measurements = latest_resp.json().get("results", [])

            pm25_value = None
            for m in measurements:
                if m.get("parameter", {}).get("name") == "pm25":
                    pm25_value = m.get("value")
                    break

            if pm25_value is None:
                return None

            return {
                "aqi_value": _pm25_to_aqi(pm25_value),
                "pm25": pm25_value,
                "source_station": location_name,
                "is_live": True,
            }

    except (httpx.HTTPError, KeyError, IndexError, TypeError):
        return None