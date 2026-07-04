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
"""


def ask_groq(user_message: str, city_context: str) -> str:
    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": f"{SYSTEM_INSTRUCTION}\n\nCITY DATA:\n{city_context}"},
            {"role": "user", "content": user_message},
        ],
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