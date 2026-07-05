import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";
import CityMap from "../components/CityMap";
import AreaCard from "../components/AreaCard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res))
      .catch(() => setError("Could not reach the backend. Make sure the FastAPI server is running."))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          City Dashboard
        </h1>
        <p className="text-ink/60">
          Live snapshot across {data.areas.length} Mumbai areas.
        </p>
      </div>

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
        <CityMap areaSummaries={data.areas} />
      </div>

      <h2 className="font-display text-xl font-semibold text-ink mb-4">Area Breakdown</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.areas.map((entry) => (
          <AreaCard key={entry.area.id} areaSummary={entry} />
        ))}
      </div>
    </div>
  );
}