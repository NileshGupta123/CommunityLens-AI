import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getDashboard, getAqiHistory, getAqiForecast } from "../services/api";

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const TREND_STYLE = {
  improving: { color: "text-safe", bg: "bg-safe/10", label: "Improving" },
  worsening: { color: "text-risk", bg: "bg-risk/10", label: "Worsening" },
  stable: { color: "text-signal-dark", bg: "bg-signal/10", label: "Stable" },
};

export default function Predictions() {
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getDashboard()
      .then((res) => {
        const areaList = res.areas.map((entry) => entry.area);
        setAreas(areaList);

        const urlAreaId = Number(searchParams.get("area"));
        const preselected = areaList.find((a) => a.id === urlAreaId);
        setSelectedAreaId(preselected ? preselected.id : areaList[0]?.id ?? null);
      })
      .catch(() => setAreas([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedAreaId) return;
    setLoading(true);

    Promise.all([
      getAqiHistory(selectedAreaId),
      getAqiForecast(selectedAreaId, 6),
    ])
      .then(([history, forecastRes]) => {
        setForecast(forecastRes);

        const historicalPoints = history.map((r) => ({
          label: formatTime(r.recorded_at),
          actual: r.aqi_value,
          predicted: null,
        }));

        const lastActual = historicalPoints[historicalPoints.length - 1];
        const bridgePoint = { ...lastActual, predicted: lastActual.actual };

        const forecastPoints = forecastRes.forecast.map((f) => ({
          label: `+${f.hours_ahead}h`,
          actual: null,
          predicted: f.predicted_value,
        }));

        setChartData([...historicalPoints.slice(0, -1), bridgePoint, ...forecastPoints]);
      })
      .finally(() => setLoading(false));
  }, [selectedAreaId]);

  const trendInfo = forecast ? TREND_STYLE[forecast.trend] : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">
            Predictive Forecasts
          </h1>
          <p className="text-ink/60">6-hour AQI projection based on recent trend.</p>
        </div>

        <select
          value={selectedAreaId || ""}
          onChange={(e) => setSelectedAreaId(Number(e.target.value))}
          className="px-4 py-2 rounded-lg border border-ink/20 bg-white font-medium text-ink focus:outline-none focus:border-signal"
        >
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-muted font-mono text-center py-16">Running forecast model...</p>
      ) : forecast ? (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-ink/10 p-4">
              <p className="text-[10px] uppercase text-slate-muted mb-1">Current AQI</p>
              <p className="font-mono text-2xl font-semibold text-ink">{forecast.current_value}</p>
            </div>
            <div className="bg-white rounded-xl border border-ink/10 p-4">
              <p className="text-[10px] uppercase text-slate-muted mb-1">6h Forecast</p>
              <p className="font-mono text-2xl font-semibold text-ink">
                {forecast.forecast[forecast.forecast.length - 1].predicted_value}
              </p>
            </div>
            <div className={`rounded-xl border border-ink/10 p-4 ${trendInfo.bg}`}>
              <p className="text-[10px] uppercase text-slate-muted mb-1">Trend</p>
              <p className={`font-mono text-2xl font-semibold ${trendInfo.color}`}>
                {trendInfo.label}
              </p>
            </div>
          </div>

          <div className="lens-frame bg-white rounded-xl border border-ink/10 p-6">
            <h2 className="font-display font-semibold text-ink mb-4">
              Historical + Forecasted AQI
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: "monospace", fontSize: 12, borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#0F172A" strokeWidth={2} dot={false} name="Actual (past 24h)" connectNulls />
                <Line type="monotone" dataKey="predicted" stroke="#F5A623" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="Predicted (next 6h)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-muted mt-2">
              Forecast generated via linear regression on the last 24 hourly readings.
            </p>
          </div>
        </>
      ) : (
        <p className="text-risk text-center py-16">Could not generate a forecast for this area.</p>
      )}
    </div>
  );
}