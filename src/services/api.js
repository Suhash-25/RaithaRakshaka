import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const api = axios.create({ baseURL: BASE, timeout: 30000 });

// Simple memory cache for instant navigation
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const fetchWithCache = async (key, fetcher) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.data);
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

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
  fetchWithCache(`weather-${location}`, () => 
    api.get(`/api/weather?location=${encodeURIComponent(location)}`).then(r => r.data)
  );

// ─── SCHEMES ──────────────────────────────────────────
export const getSchemes = (payload) =>
  fetchWithCache(`schemes-${JSON.stringify(payload)}`, () =>
    api.post('/api/schemes/eligible', payload).then(r => r.data)
  );

// ─── MARKET ───────────────────────────────────────────
export const getMarket = (crop) =>
  fetchWithCache(`market-${crop}`, () =>
    api.get(`/api/market/${encodeURIComponent(crop)}`).then(r => r.data)
  );

export const getAllMarkets = () =>
  fetchWithCache('markets-all', () =>
    api.get('/api/market').then(r => r.data)
  );

// ─── WELLNESS ─────────────────────────────────────────
export const getWellness = (concern, language = 'en') =>
  api.post('/api/wellness/support', { concern, language }).then(r => r.data);

// ─── DASHBOARD ────────────────────────────────────────
export const getDashboard = () =>
  fetchWithCache('dashboard', () =>
    api.get('/api/dashboard').then(r => r.data)
  );
