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
  
  export default function AreaCard({ areaSummary }) {
    const { area, latest_aqi, latest_traffic, hospitals } = areaSummary;
    const aqiLevel = latest_aqi ? getAqiLevel(latest_aqi.aqi_value) : null;
    const totalBedsAvailable = hospitals.reduce((sum, h) => sum + h.beds_available, 0);
  
    return (
      <div className="lens-frame bg-white rounded-xl border border-ink/10 p-5">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display font-semibold text-ink">{area.name}</h3>
          {aqiLevel && (
            <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${aqiLevel.bg} ${aqiLevel.color}`}>
              {aqiLevel.label}
            </span>
          )}
        </div>
  
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] uppercase text-slate-muted mb-1">AQI</p>
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
      </div>
    );
  }