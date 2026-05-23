import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({ baseURL: BASE, timeout: 30000 });

export const sendChat = (message, language = 'en', profile = {}) =>
  api.post('/api/chat', { message, language, profile }).then(r => r.data);

export const sendVoiceChat = (audioBlob, language = 'auto', profile = {}) => {
  const fd = new FormData();
  fd.append('file', audioBlob, 'voice.webm');
  fd.append('preferred_language', language);
  fd.append('profile', JSON.stringify(profile));
  return api.post('/api/voice/chat', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then(r => r.data);
};

export const detectDisease = (file, crop = 'Tomato', location = 'Bangalore') => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('crop', crop);
  fd.append('location', location);
  return api.post('/api/disease/detect', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
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

export const getVendors = ({ location, latitude, longitude, radius = 9000, category = 'all' }) => {
  const params = new URLSearchParams({ radius, category });
  if (location) params.set('location', location);
  if (latitude) params.set('latitude', latitude);
  if (longitude) params.set('longitude', longitude);
  return api.get(`/api/vendors?${params.toString()}`).then(r => r.data);
};
