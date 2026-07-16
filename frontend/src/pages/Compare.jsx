import { useEffect, useState } from "react";
import { getDashboard, getDecision } from "../services/api";
import InfoTooltip from "../components/InfoTooltip";

const RISK_STYLE = {
  Low: "text-safe",
  Moderate: "text-signal-dark",
  High: "text-risk",
  Severe: "text-risk",
};

function StatRow({ label, tooltip, valueA, valueB, colorA, colorB, betterIsLower }) {
  const numA = typeof valueA === "number" ? valueA : null;
  const numB = typeof valueB === "number" ? valueB : null;
  let winner = null;
  if (numA !== null && numB !== null && numA !== numB) {
    winner = betterIsLower ? (numA < numB ? "A" : "B") : numA > numB ? "A" : "B";
  }

  return (
    <div className="grid grid-cols-3 items-center py-3 border-b border-ink/5 last:border-0">
      <div className={`text-right pr-4 font-mono font-semibold ${colorA || "text-ink"} ${winner === "A" ? "text-safe" : ""}`}>
        {valueA ?? "—"}
      </div>
      <div className="text-center text-[11px] uppercase text-slate-muted flex items-center justify-center">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className={`text-left pl-4 font-mono font-semibold ${colorB || "text-ink"} ${winner === "B" ? "text-safe" : ""}`}>
        {valueB ?? "—"}
      </div>
    </div>
  );
}

export default function Compare() {
  const [areas, setAreas] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [areaAId, setAreaAId] = useState(null);
  const [areaBId, setAreaBId] = useState(null);
  const [decisionA, setDecisionA] = useState(null);
  const [decisionB, setDecisionB] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then((res) => {
      setDashboardData(res);
      const areaList = res.areas.map((e) => e.area);
      setAreas(areaList);
      if (areaList.length > 1) {
        setAreaAId(areaList[0].id);
        setAreaBId(areaList[1].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (areaAId) getDecision(areaAId).then(setDecisionA);
  }, [areaAId]);

  useEffect(() => {
    if (areaBId) getDecision(areaBId).then(setDecisionB);
  }, [areaBId]);

  if (loading || !dashboardData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center text-slate-muted font-mono">
        Loading areas...
      </div>
    );
  }

  const entryA = dashboardData.areas.find((e) => e.area.id === areaAId);
  const entryB = dashboardData.areas.find((e) => e.area.id === areaBId);
  const bedsA = entryA ? entryA.hospitals.reduce((s, h) => s + h.beds_available, 0) : null;
  const bedsB = entryB ? entryB.hospitals.reduce((s, h) => s + h.beds_available, 0) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">Compare Areas</h1>
        <p className="text-ink/60">See two areas side by side to decide where to go.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <select
          value={areaAId || ""}
          onChange={(e) => setAreaAId(Number(e.target.value))}
          className="px-4 py-2.5 rounded-lg border border-ink/20 bg-white font-medium text-ink focus:outline-none focus:border-signal text-center"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={areaBId || ""}
          onChange={(e) => setAreaBId(Number(e.target.value))}
          className="px-4 py-2.5 rounded-lg border border-ink/20 bg-white font-medium text-ink focus:outline-none focus:border-signal text-center"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="lens-frame bg-white rounded-xl border border-ink/10 p-6">
        <div className="grid grid-cols-3 items-center pb-4 mb-2 border-b-2 border-ink/10">
          <h2 className="text-right pr-4 font-display font-semibold text-lg text-ink">
            {entryA?.area.name || "—"}
          </h2>
          <span className="text-center text-[10px] uppercase text-slate-muted font-mono">vs</span>
          <h2 className="text-left pl-4 font-display font-semibold text-lg text-ink">
            {entryB?.area.name || "—"}
          </h2>
        </div>

        <StatRow
          label="AQI"
          tooltip="Air Quality Index - lower is better."
          valueA={entryA?.latest_aqi?.aqi_value}
          valueB={entryB?.latest_aqi?.aqi_value}
          betterIsLower
        />
        <StatRow
          label="Traffic"
          valueA={entryA?.latest_traffic?.congestion_level}
          valueB={entryB?.latest_traffic?.congestion_level}
        />
        <StatRow
          label="Avg Speed"
          valueA={entryA?.latest_traffic ? `${entryA.latest_traffic.avg_speed_kmph} km/h` : null}
          valueB={entryB?.latest_traffic ? `${entryB.latest_traffic.avg_speed_kmph} km/h` : null}
        />
        <StatRow
          label="Beds Available"
          valueA={bedsA}
          valueB={bedsB}
        />
        <StatRow
          label="Risk Score"
          tooltip="Composite of AQI (50%), traffic (30%), and hospital load (20%). Lower is better."
          valueA={decisionA?.risk_score}
          valueB={decisionB?.risk_score}
          colorA={decisionA ? RISK_STYLE[decisionA.risk_category] : null}
          colorB={decisionB ? RISK_STYLE[decisionB.risk_category] : null}
          betterIsLower
        />
      </div>

      {decisionA && decisionB && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl border border-ink/10 p-4">
            <p className="text-xs text-ink/70 italic">{decisionA.ai_summary}</p>
          </div>
          <div className="bg-white rounded-xl border border-ink/10 p-4">
            <p className="text-xs text-ink/70 italic">{decisionB.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}