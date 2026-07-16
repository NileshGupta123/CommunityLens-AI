import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function aqiColor(aqi) {
  if (aqi <= 50) return "#14B8A6";
  if (aqi <= 100) return "#F5A623";
  if (aqi <= 200) return "#D9900F";
  return "#E4572E";
}

function makeIcon(color, highlighted) {
  const size = highlighted ? 28 : 20;
  const border = highlighted ? 4 : 3;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color}; border: ${border}px solid white;
      box-shadow: 0 2px ${highlighted ? 10 : 6}px rgba(0,0,0,${highlighted ? 0.5 : 0.3});
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const MUMBAI_CENTER = [19.12, 72.88];

const LEGEND_ITEMS = [
  { label: "Good (0-50)", color: "#14B8A6" },
  { label: "Moderate (51-100)", color: "#F5A623" },
  { label: "Unhealthy (101-200)", color: "#D9900F" },
  { label: "Very Unhealthy (200+)", color: "#E4572E" },
];

function FlyToFocus({ focusArea }) {
  const map = useMap();
  useEffect(() => {
    if (focusArea) {
      map.flyTo([focusArea.latitude, focusArea.longitude], 13, { duration: 1.2 });
    }
  }, [focusArea, map]);
  return null;
}

export default function CityMap({ areaSummaries, focusAreaName }) {
  const focusEntry = focusAreaName
    ? areaSummaries.find((e) => e.area.name === focusAreaName)
    : null;

  return (
    <div>
      <div className="lens-frame rounded-xl overflow-hidden border border-ink/10 h-[420px]">
        <MapContainer
          center={MUMBAI_CENTER}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {focusEntry && <FlyToFocus focusArea={focusEntry.area} />}
          {areaSummaries.map((entry) => {
            const { area, latest_aqi } = entry;
            const color = aqiColor(latest_aqi ? latest_aqi.aqi_value : 0);
            const highlighted = focusAreaName === area.name;
            return (
              <Marker
                key={area.id}
                position={[area.latitude, area.longitude]}
                icon={makeIcon(color, highlighted)}
              >
                <Popup autoPan={true}>
                  <div className="font-body">
                    <p className="font-semibold">{area.name}</p>
                    <p className="text-sm">
                      AQI: <span className="font-mono">{latest_aqi ? latest_aqi.aqi_value : "N/A"}</span>
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 px-1">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate-muted font-mono">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}