import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDashboard, getAreaReport } from "../services/api";
import CityMap from "../components/CityMap";
import AreaCard from "../components/AreaCard";
import InfoTooltip from "../components/InfoTooltip";
import { generateReportPdf } from "../utils/generateReportPdf";

const AQI_LEVELS = [
  { max: 50, label: "Good", color: "text-safe", bg: "bg-safe/10" },
  { max: 100, label: "Moderate", color: "text-signal-dark", bg: "bg-signal/10" },
  { max: 150, label: "Unhealthy (Sensitive)", color: "text-signal-dark", bg: "bg-signal/20" },
  { max: 200, label: "Unhealthy", color: "text-risk", bg: "bg-risk/10" },
  { max: 300, label: "Very Unhealthy", color: "text-risk", bg: "bg-risk/20" },
  { max: Infinity, label: "Hazardous", color: "text-risk", bg: "bg-risk/30" },
];
function getAqiLevel(aqi) {
  return AQI_LEVELS.find((l) => aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusAreaName = searchParams.get("area");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res))
      .catch(() => setError("Could not reach the backend. Make sure the FastAPI server is running."))
      .finally(() => setLoading(false));
  }, []);

  function handleSelectArea(area) {
    setSearchParams({ area: area.name });
  }

  async function handleDownloadReport(areaId) {
    setGeneratingReport(true);
    try {
      const report = await getAreaReport(areaId);
      generateReportPdf(report);
    } catch (err) {
      alert("Could not generate the report. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center text-slate-muted font-mono">
        Loading city snapshot...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center text-risk">
        {error || "No data available."}
      </div>
    );
  }

  const focusEntry = focusAreaName
    ? data.areas.find((e) => e.area.name === focusAreaName)
    : null;
  const focusAqiLevel = focusEntry?.latest_aqi ? getAqiLevel(focusEntry.latest_aqi.aqi_value) : null;
  const focusBeds = focusEntry ? focusEntry.hospitals.reduce((s, h) => s + h.beds_available, 0) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          City Dashboard
        </h1>
        <p className="text-ink/60">
          Live snapshot across {data.areas.length} Mumbai areas.
        </p>
      </div>

      {/* Selected area panel - only shows when a search/click has selected an area */}
      {focusEntry && (
        <div className="lens-frame bg-white rounded-xl border-2 border-signal p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-signal-dark font-mono mb-1">
                Selected Area
              </p>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {focusEntry.area.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadReport(focusEntry.area.id)}
                disabled={generatingReport}
                className="text-xs px-3 py-2 rounded-full bg-ink text-paper hover:bg-ink-light transition-colors disabled:opacity-50"
              >
                {generatingReport ? "Generating..." : "Download Report (PDF)"}
              </button>
              <button
                onClick={() => setSearchParams({})}
                className="text-xs px-3 py-2 rounded-full border border-ink/15 text-ink/60 hover:border-signal hover:text-signal transition-colors"
              >
                &times; Clear selection
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase text-slate-muted mb-1 flex items-center">
                Air Quality (AQI)
                <InfoTooltip text="Air Quality Index: 0-50 Good, 51-100 Moderate, 101-200 Unhealthy, 200+ Very Unhealthy." />
              </p>
              <p className={`font-mono text-2xl font-semibold ${focusAqiLevel?.color || "text-ink"}`}>
                {focusEntry.latest_aqi ? focusEntry.latest_aqi.aqi_value : "—"}
              </p>
              {focusAqiLevel && (
                <span className={`inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded ${focusAqiLevel.bg} ${focusAqiLevel.color}`}>
                  {focusAqiLevel.label}
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-muted mb-1">Traffic</p>
              <p className="font-mono text-2xl font-semibold text-ink capitalize">
                {focusEntry.latest_traffic ? focusEntry.latest_traffic.congestion_level : "—"}
              </p>
              {focusEntry.latest_traffic && (
                <p className="text-xs text-slate-muted mt-1">{focusEntry.latest_traffic.avg_speed_kmph} km/h avg</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-muted mb-1">Beds Available</p>
              <p className="font-mono text-2xl font-semibold text-safe">{focusBeds}</p>
              <p className="text-xs text-slate-muted mt-1">{focusEntry.hospitals.length} hospitals nearby</p>
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <a href={`/analytics?area=${focusEntry.area.id}`} className="text-xs text-center py-1.5 rounded-lg border border-ink/10 text-ink/70 hover:border-signal hover:text-signal transition-colors">
                View trends &rarr;
              </a>
              <a href={`/predictions?area=${focusEntry.area.id}`} className="text-xs text-center py-1.5 rounded-lg border border-ink/10 text-ink/70 hover:border-signal hover:text-signal transition-colors">
                View forecast &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] uppercase tracking-wide text-slate-muted font-mono mb-2">
        City-wide totals
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <p className="text-[10px] uppercase text-slate-muted mb-1">City Avg AQI</p>
          <p className="font-mono text-2xl font-semibold text-ink">{data.city_avg_aqi}</p>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <p className="text-[10px] uppercase text-slate-muted mb-1">Worst Air Quality</p>
          <p className="font-mono text-lg font-semibold text-risk">{data.worst_aqi_area}</p>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <p className="text-[10px] uppercase text-slate-muted mb-1">Most Congested</p>
          <p className="font-mono text-lg font-semibold text-signal-dark">{data.most_congested_area}</p>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <p className="text-[10px] uppercase text-slate-muted mb-1">Beds Available</p>
          <p className="font-mono text-2xl font-semibold text-safe">{data.total_beds_available}</p>
        </div>
      </div>

      <div className="mb-8">
        <CityMap areaSummaries={data.areas} focusAreaName={focusAreaName} />
      </div>

      <h2 className="font-display text-xl font-semibold text-ink mb-4">Area Breakdown</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.areas.map((entry) => (
          <AreaCard
            key={entry.area.id}
            areaSummary={entry}
            highlighted={focusAreaName === entry.area.name}
            onSelect={handleSelectArea}
          />
        ))}
      </div>
    </div>
  );
}