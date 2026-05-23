import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

export const sendChat = (message, language = 'en', profile = {}) =>
  api.post('/api/chat', { message, language, profile }).then(r => r.data);

export const detectDisease = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/api/disease/detect', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const getWeather = (location = 'Bangalore') =>
  api.get(`/api/weather?location=${encodeURIComponent(location)}`).then(r => r.data);

export const getSchemes = (payload) =>
  api.post('/api/schemes/eligible', payload).then(r => r.data);

export const translateBatch = (texts = [], targetLang = 'en', sourceLang = 'en') =>
  api.post('/api/translate/batch', {
    texts,
    target_lang: targetLang,
    source_lang: sourceLang,
  }).then(r => r.data);

const normaliseMarketLocation = (location = 'Bangalore', state = 'Karnataka') => {
  if (typeof location === 'string') {
    return { district: location, state, mandi: location, coordinates: {} };
  }
  return {
    district: location?.district || location?.location || location?.mandi || 'Bangalore',
    state: location?.state || state || 'Karnataka',
    mandi: location?.mandi || location?.district || location?.location || '',
    coordinates: location?.coordinates || {},
  };
};

const marketParams = (location, state) => {
  const loc = normaliseMarketLocation(location, state);
  const params = new URLSearchParams({
    location: loc.district,
    district: loc.district,
    state: loc.state,
  });
  if (loc.mandi) params.set('mandi', loc.mandi);
  if (loc.coordinates?.latitude) params.set('latitude', loc.coordinates.latitude);
  if (loc.coordinates?.longitude) params.set('longitude', loc.coordinates.longitude);
  return params.toString();
};

export const getMarket = (crop, location = 'Bangalore', state = 'Karnataka') =>
  api.get(`/api/market/${encodeURIComponent(crop)}?${marketParams(location, state)}`).then(r => r.data);

export const getAllMarkets = (location = 'Bangalore', state = 'Karnataka') =>
  api.get(`/api/market?${marketParams(location, state)}`).then(r => r.data);

export const getWellness = (concern, language = 'en') =>
  api.post('/api/wellness/support', { concern, language }).then(r => r.data);

export const getDashboard = () =>
  api.get('/api/dashboard').then(r => r.data);

export const getProviderStatus = () =>
  api.get('/api/provider-status').then(r => r.data);

export const analyzeLocation = (latitude, longitude, crop = 'Tomato') =>
  api.post('/api/analyze-location', { latitude, longitude, crop }).then(r => r.data);

export const getLocationWeather = (latitude, longitude) =>
  api.post('/api/weather-data', { latitude, longitude }).then(r => r.data);

export const getLocationSoil = (latitude, longitude) =>
  api.post('/api/soil-data', { latitude, longitude }).then(r => r.data);

export const getLocationNdvi = (latitude, longitude) =>
  api.post('/api/ndvi-analysis', { latitude, longitude }).then(r => r.data);
