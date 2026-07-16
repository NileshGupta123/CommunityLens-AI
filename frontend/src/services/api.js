import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const checkHealth = () => api.get("/health").then((res) => res.data);

export const getDashboard = () => api.get("/dashboard").then((res) => res.data);

export const getAqiHistory = (areaId) =>
  api.get(`/aqi/history/${areaId}`).then((res) => res.data);

export const getLiveAqi = (areaId) =>
  api.get(`/aqi/live/${areaId}`).then((res) => res.data);

export const getTrafficHistory = (areaId) =>
  api.get(`/traffic/history/${areaId}`).then((res) => res.data);

export const getHospitals = () => api.get("/hospitals").then((res) => res.data);

export const getOvercrowdedHospitals = (threshold = 85) =>
  api.get(`/hospitals/overcrowded?threshold=${threshold}`).then((res) => res.data);

export const sendChatMessage = (message, history = []) =>
  api.post("/chat", { message, history }).then((res) => res.data);

export const getDecision = (areaId) =>
  api.get(`/decision/${areaId}`).then((res) => res.data);

export const getAllDecisions = () => api.get("/decision").then((res) => res.data);

export const getAqiForecast = (areaId, hours = 6) =>
  api.get(`/predict/aqi/${areaId}?hours=${hours}`).then((res) => res.data);

export const getAreaReport = (areaId) =>
  api.get(`/report/${areaId}`).then((res) => res.data);

export default api;