from google import genai

from app.config import settings

_client = genai.Client(api_key=settings.gemini_api_key)

SYSTEM_INSTRUCTION = """You are CommunityLens AI, an assistant that helps citizens of Mumbai make \
better everyday decisions using live city data (air quality, traffic, and hospital availability).

Rules:
- Only use the CITY DATA provided below to answer. Do not invent numbers.
- Be concise and direct — 2-4 sentences, no long preambles.
- When relevant, give a clear recommendation (e.g. "avoid X area", "Y hospital has beds available").
- If the data provided doesn't answer the question, say so honestly instead of guessing.
"""


def format_city_data(dashboard_data: dict) -> str:
    """Turn the dashboard snapshot into a compact text block the AI can reason over."""
    lines = [
        f"City-wide average AQI: {dashboard_data['city_avg_aqi']}",
        f"Worst air quality area: {dashboard_data['worst_aqi_area']}",
        f"Most congested area: {dashboard_data['most_congested_area']}",
        f"Total hospital beds available city-wide: {dashboard_data['total_beds_available']}",
        "",
        "Per-area details:",
    ]
    for entry in dashboard_data["areas"]:
        area = entry["area"]
        aqi = entry.get("latest_aqi")
        traffic = entry.get("latest_traffic")
        hospitals = entry.get("hospitals", [])

        line = f"- {area['name']}: "
        if aqi:
            line += f"AQI {aqi['aqi_value']} (PM2.5 {aqi['pm25']}, PM10 {aqi['pm10']}); "
        if traffic:
            line += f"traffic {traffic['congestion_level']} ({traffic['avg_speed_kmph']} km/h avg); "
        if hospitals:
            hosp_summary = ", ".join(
                f"{h['name']} {h['beds_available']}/{h['total_beds']} beds free ({h['occupancy_percent']}% full)"
                for h in hospitals
            )
            line += f"hospitals: {hosp_summary}"
        lines.append(line)

    return "\n".join(lines)


def ask_gemini(user_message: str, city_context: str) -> str:
    prompt = f"{SYSTEM_INSTRUCTION}\n\nCITY DATA:\n{city_context}\n\nUSER QUESTION: {user_message}"

    response = _client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text