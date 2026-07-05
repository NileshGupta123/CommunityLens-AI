from fastapi import FastAPI
from app.routers import dashboard, aqi, traffic, hospitals, chat, decision, predict
from fastapi.middleware.cors import CORSMiddleware


from app.config import settings
from app.db import init_db

app = FastAPI(
    title="CommunityLens AI",
    description="AI-Powered Decision Intelligence Platform for Smarter Communities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(aqi.router)
app.include_router(traffic.router)
app.include_router(hospitals.router)
app.include_router(chat.router)
app.include_router(decision.router)
app.include_router(predict.router)


@app.on_event("startup")
async def on_startup():
    await init_db()
    from data.seed_generator import seed_if_empty
    await seed_if_empty()


@app.get("/")
async def root():
    return {
        "message": "CommunityLens AI backend is running",
        "status": "ok",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}