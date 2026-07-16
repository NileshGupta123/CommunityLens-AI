import { Link } from "react-router-dom";
import InfoTooltip from "./InfoTooltip";

const AQI_LEVELS = [
  { max: 50, label: "Good", color: "text-safe", bg: "bg-safe/10" },
  { max: 100, label: "Moderate", color: "text-signal-dark", bg: "bg-signal/10" },
  { max: 150, label: "Unhealthy (Sensitive)", color: "text-signal-dark", bg: "bg-signal/20" },
  { max: 200, label: "Unhealthy", color: "text-risk", bg: "bg-risk/10" },
  { max: 300, label: "Very Unhealthy", color: "text-risk", bg: "bg-risk/20" },
  { max: Infinity, label: "Hazardous", color: "text-risk", bg: "bg-risk/30" },
];

function getAqiLevel(aqi) {
  return AQI_LEVELS.find((level) => aqi <= level.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

const CONGESTION_COLOR = {
  low: "text-safe",
  moderate: "text-signal-dark",
  high: "text-risk",
  severe: "text-risk",
};

export default function AreaCard({ areaSummary, highlighted = false, onSelect }) {
  const { area, latest_aqi, latest_traffic, hospitals } = areaSummary;
  const aqiLevel = latest_aqi ? getAqiLevel(latest_aqi.aqi_value) : null;
  const totalBedsAvailable = hospitals.reduce((sum, h) => sum + h.beds_available, 0);

  return (
    <div
      className={`lens-frame bg-white rounded-xl border p-5 transition-all ${
        highlighted ? "border-signal ring-2 ring-signal/30" : "border-ink/10"
      }`}
    >
      <button
        onClick={() => onSelect && onSelect(area)}
        className="flex items-start justify-between mb-4 w-full text-left group"
      >
        <h3 className="font-display font-semibold text-ink group-hover:text-signal transition-colors">
          {area.name}
        </h3>
        {aqiLevel && (
          <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${aqiLevel.bg} ${aqiLevel.color}`}>
            {aqiLevel.label}
          </span>
        )}
      </button>

      <div className="grid grid-cols-3 gap-3 text-center mb-4">
        <div>
          <p className="text-[10px] uppercase text-slate-muted mb-1 flex items-center justify-center">
            AQI
            <InfoTooltip text="Air Quality Index: 0-50 Good, 51-100 Moderate, 101-200 Unhealthy, 200+ Very Unhealthy." />
          </p>
          <p className={`font-mono text-xl font-semibold ${aqiLevel?.color || "text-ink"}`}>
            {latest_aqi ? latest_aqi.aqi_value : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-muted mb-1">Traffic</p>
          <p className={`font-mono text-sm font-semibold capitalize ${CONGESTION_COLOR[latest_traffic?.congestion_level] || "text-ink"}`}>
            {latest_traffic ? latest_traffic.congestion_level : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-muted mb-1">Beds Free</p>
          <p className="font-mono text-xl font-semibold text-ink">{totalBedsAvailable}</p>
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        <Link
          to={`/analytics?area=${area.id}`}
          className="flex-1 text-center py-1.5 rounded-lg border border-ink/10 text-ink/70 hover:border-signal hover:text-signal transition-colors"
        >
          Trends
        </Link>
        <Link
          to={`/predictions?area=${area.id}`}
          className="flex-1 text-center py-1.5 rounded-lg border border-ink/10 text-ink/70 hover:border-signal hover:text-signal transition-colors"
        >
          Forecast
        </Link>
      </div>
    </div>
  );
}