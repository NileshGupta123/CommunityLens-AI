import { useEffect, useState } from "react";
import { getAllDecisions, getOvercrowdedHospitals } from "../services/api";

const RISK_STYLE = {
  Low: { bg: "bg-safe/10", text: "text-safe", border: "border-safe/30" },
  Moderate: { bg: "bg-signal/10", text: "text-signal-dark", border: "border-signal/30" },
  High: { bg: "bg-risk/10", text: "text-risk", border: "border-risk/30" },
  Severe: { bg: "bg-risk/20", text: "text-risk", border: "border-risk/50" },
};

export default function Alerts() {
  const [decisions, setDecisions] = useState([]);
  const [overcrowded, setOvercrowded] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllDecisions(), getOvercrowdedHospitals(85)])
      .then(([decisionsRes, overcrowdedRes]) => {
        setDecisions(decisionsRes);
        setOvercrowded(overcrowdedRes);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center text-slate-muted font-mono">
        Running decision intelligence engine...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          Alerts &amp; Decision Intelligence
        </h1>
        <p className="text-ink/60">
          Composite risk ranking across all areas, plus live hospital capacity alerts.
        </p>
      </div>

      {overcrowded.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-lg font-semibold text-risk mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-risk animate-pulse" />
            Overcrowded Hospitals ({overcrowded.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {overcrowded.map((h) => (
              <div key={h.id} className="bg-risk/5 border border-risk/20 rounded-lg p-4">
                <p className="font-medium text-ink">{h.name}</p>
                <p className="text-sm text-ink/60">
                  {h.occupancy_percent}% full · {h.beds_available}/{h.total_beds} beds free
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display text-lg font-semibold text-ink mb-4">
        Area Risk Ranking (worst first)
      </h2>
      <div className="space-y-4">
        {decisions.map((d, i) => {
          const style = RISK_STYLE[d.risk_category] || RISK_STYLE.Moderate;
          return (
            <div
              key={d.area_name}
              className={`lens-frame bg-white rounded-xl border ${style.border} p-6`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-muted">#{i + 1}</span>
                  <h3 className="font-display font-semibold text-ink text-lg">{d.area_name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono uppercase px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                    {d.risk_category}
                  </span>
                  <span className="font-mono text-xl font-semibold text-ink">
                    {d.risk_score}<span className="text-sm text-slate-muted">/100</span>
                  </span>
                </div>
              </div>

              <p className="text-sm text-ink/70 mb-3 italic">{d.ai_summary}</p>

              <ul className="space-y-1">
                {d.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-ink/80 flex items-start gap-2">
                    <span className="text-signal mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}