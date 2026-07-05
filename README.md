# 🔍 CommunityLens AI — AI-Powered Decision Intelligence Platform for Smarter Communities

![COMMUNITYLENS](https://img.shields.io/badge/COMMUNITYLENS-V1.0.0-6E56CF) ![GEMINI](https://img.shields.io/badge/GEMINI-2.5--FLASH-4285F4) ![GROQ](https://img.shields.io/badge/GROQ-LLAMA--3.3--70B-00B8A9) ![FASTAPI](https://img.shields.io/badge/FASTAPI-0.115-0F172A) ![REACT](https://img.shields.io/badge/REACT-19-0F172A) ![STATUS](https://img.shields.io/badge/STATUS-LIVE-16A34A)

> An AI-powered decision intelligence platform where live air quality, traffic, and hospital data across Mumbai feed a Gemini + Groq assistant — then get turned into risk scores, forecasts, and real recommendations. Built for the Gen AI Academy APAC Edition (Google Cloud × NVIDIA) hackathon.

---

## 🚀 Live Demo

👉 **[communitylens-frontend.onrender.com](https://communitylens-frontend.onrender.com)** — the app

👉 **[communitylens-ai.onrender.com/docs](https://communitylens-ai.onrender.com/docs)** — backend API docs

> ⚠️ Hosted on Render's free tier — the backend may take 30-60s to wake up on first load after inactivity.

---

## 🧭 The Problem

Modern cities generate huge volumes of data — traffic, air quality, hospital capacity, public services — but it's scattered across disconnected sources. A citizen deciding *"should I go outside today?"* or *"which hospital should I go to?"* has to piece together information from multiple apps and websites.

**CommunityLens AI** solves this with a single AI-powered assistant that ingests live city data, reasons over it, and gives a direct, actionable decision — not just raw numbers.

---

## ✨ Features

| Page | What it does |
|---|---|
| 🏠 **Landing** | Live city snapshot hero pulled straight from the database |
| 📊 **Dashboard** | Interactive Mumbai map (color-coded by AQI severity) + city-wide summary cards |
| 📈 **Analytics** | 24-hour historical AQI & traffic trend charts per area |
| 🔮 **Predictions** | 6-hour AQI forecast using linear regression on live historical data |
| 💬 **AI Chat** | Natural-language assistant grounded in real city data — multi-turn memory, voice input, and automatic **Gemini → Groq fallback** with live status indicator |
| 🚨 **Alerts & Decisions** | Composite risk-scoring engine (AQI + traffic + hospital load) with a rule-based recommendation chain, plus real-time overcrowded hospital detection |

---

## 🏗️ Architecture

```
React (Vite + Tailwind)
        │
        ▼
FastAPI Backend  ──────►  SQLite (async, self-seeding)
        │
        ├──► Gemini API  (primary AI — chat assistant)
        ├──► Groq (Llama 3.3 70B)  (fallback AI + decision summaries)
        ├──► OpenAQ API  (live air quality, with simulated fallback)
        └──► scikit-learn  (linear regression forecasting)
```

**Key engineering decisions:**
- **Resilient AI layer** — the chat assistant tries Gemini first (Google Cloud's model, per the hackathon brief) and automatically falls back to Groq if Gemini is rate-limited or unavailable. The UI transparently shows which model answered.
- **Self-healing database** — the SQLite database auto-reseeds on startup if empty, so the app recovers automatically on platforms with ephemeral storage (like Render's free tier) with zero manual intervention.
- **Hybrid live/simulated data** — the platform attempts to fetch real air quality data from OpenAQ's public API first, and gracefully falls back to realistic simulated data when no live station is nearby.
- **Explainable risk scoring** — the Decision Intelligence engine uses a transparent weighted formula (50% AQI, 30% traffic, 20% hospital load) rather than an opaque AI judgment, with an AI-generated explanation layered on top.

---

## 🛠️ Tech Stack

**Backend:** FastAPI · SQLAlchemy (async) · SQLite · Pydantic · Gemini API · Groq · scikit-learn · pandas · httpx

**Frontend:** React 19 · Vite · Tailwind CSS · React Router · Recharts · Leaflet · Axios

**Data:** OpenAQ (live air quality) · Realistic simulated traffic & hospital data (rush-hour-aware generation)

**Deployment:** Render (backend web service + frontend static site)

---

## 📂 Project Structure

```
communitylens-ai/
├── backend/
│   ├── app/
│   │   ├── routers/        # dashboard, aqi, traffic, hospitals, chat, decision, predict
│   │   ├── services/       # gemini_service, groq_service, forecast_service, openaq_service
│   │   ├── models/         # SQLAlchemy models (Area, AQIReading, TrafficReading, Hospital)
│   │   ├── main.py
│   │   ├── db.py
│   │   ├── config.py
│   │   └── schemas.py
│   ├── data/
│   │   └── seed_generator.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/           # Landing, Dashboard, Analytics, Predictions, Chat, Alerts
        ├── components/      # Navbar, CityMap, AreaCard
        └── services/api.js
```

---

## ⚙️ Local Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # Windows
pip install -r requirements.txt
cp .env.example .env             # then add your GEMINI_API_KEY and GROQ_API_KEY
python -m data.seed_generator    # seed the local database
uvicorn app.main:app --reload
```
API available at `http://127.0.0.1:8000`, docs at `/docs`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env             # confirm VITE_API_BASE_URL points to your backend
npm run dev
```
App available at `http://localhost:5173`.

---

## 🎯 Hackathon Context

Built for the **Gen AI Academy APAC Edition** (Google Cloud × NVIDIA), Cohort 2 — Problem Statement 1: *"AI for Better Living and Smarter Communities."*

Addresses: environmental sustainability, healthcare access, and urban mobility — three of the challenge's suggested solution areas — through a single AI-powered decision intelligence platform.

---

## 👤 Author

**Nilesh Gupta**
Computer Engineering, Thakur College of Engineering & Technology
[GitHub](https://github.com/NileshGupta123)

---

## 📄 License

MIT