import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

// ─── CHAT ─────────────────────────────────────────────
export const sendChat = (message, language = 'en') =>
  api.post('/api/chat', { message, language }).then(r => r.data);

// ─── DISEASE ──────────────────────────────────────────
export const detectDisease = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/api/disease/detect', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

// ─── WEATHER ──────────────────────────────────────────
export const getWeather = (location = 'Bangalore') =>
  api.get(`/api/weather?location=${encodeURIComponent(location)}`).then(r => r.data);

// ─── SCHEMES ──────────────────────────────────────────
export const getSchemes = (payload) =>
  api.post('/api/schemes/eligible', payload).then(r => r.data);

// ─── MARKET ───────────────────────────────────────────
export const getMarket = (crop) =>
  api.get(`/api/market/${encodeURIComponent(crop)}`).then(r => r.data);

export const getAllMarkets = () =>
  api.get('/api/market').then(r => r.data);

// ─── WELLNESS ─────────────────────────────────────────
export const getWellness = (concern, language = 'en') =>
  api.post('/api/wellness/support', { concern, language }).then(r => r.data);

// ─── DASHBOARD ────────────────────────────────────────
export const getDashboard = () =>
  api.get('/api/dashboard').then(r => r.data);
