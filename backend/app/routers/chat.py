from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import ChatRequest, ChatResponse
from app.routers.dashboard import get_dashboard
from app.services.gemini_service import ask_gemini, format_city_data
from app.services.groq_service import ask_groq

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    dashboard = await get_dashboard(db=db)
    dashboard_data = dashboard.model_dump()
    city_context = format_city_data(dashboard_data)

    try:
        reply = ask_gemini(request.message, city_context)
        return ChatResponse(reply=reply)
    except Exception as gemini_error:
        try:
            reply = ask_groq(request.message, city_context)
            return ChatResponse(reply=reply)
        except Exception as groq_error:
            raise HTTPException(
                status_code=502,
                detail=f"Both AI services failed. Gemini: {str(gemini_error)}. Groq: {str(groq_error)}",
            )