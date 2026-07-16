import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../services/api";

const FEATURES = [
  {
    title: "Live Dashboard",
    desc: "Real-time AQI, traffic, and hospital capacity across 8 Mumbai areas on one map.",
    to: "/dashboard",
    tag: "Map + Charts",
  },
  {
    title: "Trend Analytics",
    desc: "24-hour historical trends for air quality and traffic congestion per area.",
    to: "/analytics",
    tag: "Recharts",
  },
  {
    title: "Predictive Forecasts",
    desc: "6-hour AQI forecasts using regression on live historical trends.",
    to: "/predictions",
    tag: "scikit-learn",
  },
  {
    title: "AI Chat Assistant",
    desc: "Ask natural-language questions, get answers grounded in real city data.",
    to: "/chat",
    tag: "Gemini + Groq",
  },
  {
    title: "Decision Intelligence",
    desc: "Composite risk scoring with a rule-based recommendation chain per area.",
    to: "/alerts",
    tag: "Risk Engine",
  },
  {
    title: "Live Alerts",
    desc: "Overcrowded hospital detection and worst-risk-area ranking, updated live.",
    to: "/alerts",
    tag: "Real-time",
  },
];

const TECH_STACK = [
  "Gemini API", "Groq", "FastAPI", "React", "OpenAQ", "SQLAlchemy", "Recharts", "Leaflet",
];

export default function Landing() {
  const [stat, setStat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((data) => setStat(data))
      .catch(() => setStat(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-muted">
            Live city data · Mumbai
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-semibold text-ink leading-tight max-w-3xl">
          Ask your city anything.
          <br />
          Get the <span className="text-signal">decision</span>, not just the data.
        </h1>

        <p className="mt-6 text-lg text-ink/70 max-w-2xl">
          CommunityLens AI turns scattered air quality, traffic, and hospital data into
          one AI-powered assistant — built for the Gen AI Academy APAC Edition
          (Google Cloud × NVIDIA) hackathon.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-ink text-paper font-medium rounded-lg hover:bg-ink-light transition-colors"
          >
            Explore Dashboard
          </Link>
          <Link
            to="/chat"
            className="px-6 py-3 border border-ink/20 text-ink font-medium rounded-lg hover:border-signal hover:text-signal transition-colors"
          >
            Try AI Chat
          </Link>
        </div>

        {/* Live stat card */}
        <div className="lens-frame mt-14 bg-white rounded-xl border border-ink/10 p-6 max-w-xl">
          {loading ? (
            <p className="text-sm text-slate-muted font-mono">Loading live city snapshot...</p>
          ) : stat ? (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-muted mb-1">City Avg AQI</p>
                <p className="font-mono text-2xl font-semibold text-ink">{stat.city_avg_aqi}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-muted mb-1">Worst Air Quality</p>
                <p className="font-mono text-lg font-semibold text-risk">{stat.worst_aqi_area}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-muted mb-1">Beds Available</p>
                <p className="font-mono text-2xl font-semibold text-safe">{stat.total_beds_available}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-muted">
              Backend not reachable — start the FastAPI server to see live data.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-10 text-center">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-safe/10 text-safe font-display font-semibold text-lg flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <h3 className="font-display font-semibold text-ink mb-2">We track live city data</h3>
            <p className="text-sm text-ink/60">
              Air quality, traffic, and hospital capacity across 8 Mumbai areas, updated continuously.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-signal/10 text-signal-dark font-display font-semibold text-lg flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <h3 className="font-display font-semibold text-ink mb-2">AI analyzes the risk</h3>
            <p className="text-sm text-ink/60">
              A weighted scoring engine combines pollution, congestion, and hospital load into one risk score per area.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-risk/10 text-risk font-display font-semibold text-lg flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <h3 className="font-display font-semibold text-ink mb-2">You get a clear decision</h3>
            <p className="text-sm text-ink/60">
              Ask the AI assistant, search any area, or browse the dashboard &#8212; and get a direct recommendation, not just numbers.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-2">
          One platform, six ways to see your city
        </h2>
        <p className="text-ink/60 mb-10">
          Every feature below is backed by live, queryable data — not static mockups.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group block p-6 rounded-xl border border-ink/10 bg-white hover:border-signal transition-colors"
            >
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-signal-dark bg-signal/10 px-2 py-1 rounded mb-4">
                {f.tag}
              </span>
              <h3 className="font-display font-semibold text-ink text-lg mb-2 group-hover:text-signal transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-ink/60">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-ink/10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-6">Built with</h2>
        <div className="flex flex-wrap gap-3">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 bg-ink text-paper text-sm font-mono rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink/10 py-8 text-center text-sm text-slate-muted">
        CommunityLens AI — Gen AI Academy APAC Edition (Google Cloud × NVIDIA) Hackathon, Cohort 2
      </footer>
    </div>
  );
}