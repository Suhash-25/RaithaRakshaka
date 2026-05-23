import axios from 'axios';
import i18n from '../i18n';

const BASE = import.meta.env.VITE_API_URL || '';

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

const SKIP_DYNAMIC_KEYS = new Set([
  'id', 'url', 'href', 'maps_url', 'source', 'provider', 'updated_at', 'created_at',
  'latitude', 'longitude', 'lat', 'lng', 'price', 'min_price', 'max_price', 'modal_price',
  'current_price', 'distance_km', 'radius_m', 'count', 'available', 'coordinates',
]);

const shouldTranslateString = (value) =>
  typeof value === 'string'
  && /[A-Za-z]/.test(value)
  && !/^https?:\/\//i.test(value)
  && !/^[A-Z0-9_-]{2,}$/i.test(value.trim());

export const translateDynamicPayload = async (payload, targetLang = i18n.language || 'en') => {
  if (!payload || targetLang === 'en') return payload;
  const refs = [];
  const texts = [];

  const walk = (value, key = '', parent = null, index = null) => {
    if (typeof value === 'string') {
      if (!SKIP_DYNAMIC_KEYS.has(key) && shouldTranslateString(value)) {
        refs.push({ set: parent, key: index, value });
        texts.push(value);
      }
      return value;
    }
    if (Array.isArray(value)) {
      value.forEach((item, childIndex) => walk(item, key, value, childIndex));
      return value;
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([childKey, childValue]) => {
        if (SKIP_DYNAMIC_KEYS.has(childKey)) return;
        if (typeof childValue === 'string' && shouldTranslateString(childValue)) {
          refs.push({ set: value, key: childKey, value: childValue });
          texts.push(childValue);
          return;
        }
        walk(childValue, childKey, value, childKey);
      });
    }
    return value;
  };

  walk(payload);
  if (!texts.length) return payload;
  const unique = Array.from(new Set(texts));
  try {
    const response = await translateBatch(unique, targetLang, 'en');
    const translated = response?.translated || [];
    const dictionary = new Map(unique.map((text, index) => [text, translated[index] || text]));
    refs.forEach(ref => {
      if (ref.set && ref.key !== null && ref.key !== undefined) ref.set[ref.key] = dictionary.get(ref.value) || ref.value;
    });
  } catch {
    // Dynamic translation is additive; API data remains usable if translation fails.
  }
  return payload;
};

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

export const getVendors = ({ location, latitude, longitude, radius = 9000, category = 'all', language = i18n.language || 'en' }) => {
  const params = new URLSearchParams({ radius, category, language });
  if (location) params.set('location', location);
  if (latitude) params.set('latitude', latitude);
  if (longitude) params.set('longitude', longitude);
  return api.get(`/api/vendors?${params.toString()}`).then(r => r.data);
};
