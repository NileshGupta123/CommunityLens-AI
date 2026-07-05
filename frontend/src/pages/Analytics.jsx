import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getDashboard, getAqiHistory, getTrafficHistory } from "../services/api";

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CONGESTION_TO_NUM = { low: 1, moderate: 2, high: 3, severe: 4 };

export default function Analytics() {
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [aqiData, setAqiData] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => {
        const areaList = res.areas.map((entry) => entry.area);
        setAreas(areaList);
        if (areaList.length > 0) setSelectedAreaId(areaList[0].id);
      })
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    if (!selectedAreaId) return;
    setLoading(true);

    Promise.all([
      getAqiHistory(selectedAreaId),
      getTrafficHistory(selectedAreaId),
    ])
      .then(([aqi, traffic]) => {
        setAqiData(
          aqi.map((r) => ({
            time: formatTime(r.recorded_at),
            aqi: r.aqi_value,
            pm25: r.pm25,
          }))
        );
        setTrafficData(
          traffic.map((r) => ({
            time: formatTime(r.recorded_at),
            speed: r.avg_speed_kmph,
            congestion: CONGESTION_TO_NUM[r.congestion_level] || 0,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [selectedAreaId]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">
            Trend Analytics
          </h1>
          <p className="text-ink/60">24-hour historical AQI and traffic trends.</p>
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
        <p className="text-slate-muted font-mono text-center py-16">Loading trend data...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="lens-frame bg-white rounded-xl border border-ink/10 p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Air Quality Index (24h)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={aqiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontFamily: "monospace", fontSize: 12, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="#E4572E"
                  strokeWidth={2}
                  dot={false}
                  name="AQI"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="lens-frame bg-white rounded-xl border border-ink/10 p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Avg Traffic Speed (24h)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "km/h", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontFamily: "monospace", fontSize: 12, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#F5A623"
                  strokeWidth={2}
                  dot={false}
                  name="Avg Speed (km/h)"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-muted mt-2">
              Lower speed = higher congestion. Dips typically align with rush hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}