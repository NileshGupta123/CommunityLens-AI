from groq import Groq

from app.config import settings

_client = Groq(api_key=settings.groq_api_key)

SYSTEM_INSTRUCTION = """You are CommunityLens AI, an assistant that helps citizens of Mumbai make \
better everyday decisions using live city data (air quality, traffic, and hospital availability).

Rules:
- Only use the CITY DATA provided below to answer. Do not invent numbers.
- Be concise and direct — 2-4 sentences, no long preambles.
- When relevant, give a clear recommendation (e.g. "avoid X area", "Y hospital has beds available").
- If the data provided doesn't answer the question, say so honestly instead of guessing.
- Use the conversation history to understand follow-up questions and context.
"""


def ask_groq(user_message: str, city_context: str, history: list = None) -> str:
    messages = [
        {"role": "system", "content": f"{SYSTEM_INSTRUCTION}\n\nCITY DATA:\n{city_context}"},
    ]

    for msg in (history or [])[-6:]:
        role = "user" if msg.role == "user" else "assistant"
        messages.append({"role": role, "content": msg.text})

    messages.append({"role": "user", "content": user_message})

    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.3,
        max_tokens=300,
    )
    return response.choices[0].message.content


def summarize_decision(area_name: str, risk_score: float, risk_category: str, recommendations: list[str]) -> str:
    """Generate a short natural-language explanation for a decision intelligence result."""
    rec_text = "; ".join(recommendations)
    prompt = (
        f"Area: {area_name}. Risk score: {risk_score}/100 ({risk_category}). "
        f"Recommended actions: {rec_text}. "
        "In 1-2 short sentences, explain why this area has this risk level and what "
        "residents should do. Be direct and practical, no preamble."
    )
    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=120,
    )
    return response.choices[0].message.content


def generate_area_report(area_name: str, stats: dict) -> str:
    """Generate a longer, structured narrative report for one area (used for the PDF report)."""
    prompt = f"""Write a concise city-conditions report for {area_name}, Mumbai, based on this live data:

Air Quality Index: {stats['aqi_value']} (PM2.5: {stats['pm25']}, PM10: {stats['pm10']})
Traffic: {stats['congestion_level']} congestion, {stats['avg_speed_kmph']} km/h average speed
Hospitals: {stats['total_hospitals']} nearby, {stats['beds_available']} beds available
Risk Score: {stats['risk_score']}/100 ({stats['risk_category']})

Write 3 short paragraphs:
1. Current conditions summary (2-3 sentences)
2. What this means for residents today (2-3 sentences, practical)
3. A brief outlook/recommendation (1-2 sentences)

Be direct, factual, and practical. No headers, no markdown, no preamble — just the three paragraphs."""

    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=400,
    )
    return response.choices[0].message.content