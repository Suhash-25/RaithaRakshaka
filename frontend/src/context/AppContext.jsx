import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import i18n, { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from '../i18n';

const AppContext = createContext(null);
const LOCATION_STORAGE_KEY = 'raitha:selectedLocation';
const DEFAULT_LOCATION = {
  district: 'Bangalore',
  state: 'Karnataka',
  coordinates: {},
  mandi: 'Bangalore',
};

function cleanLocation(input) {
  if (typeof input === 'string') {
    const district = input.trim() || DEFAULT_LOCATION.district;
    return { ...DEFAULT_LOCATION, district, mandi: district };
  }
  const value = input || {};
  const district = String(value.district || value.location || value.mandi || DEFAULT_LOCATION.district).trim();
  const state = String(value.state || DEFAULT_LOCATION.state).trim();
  const mandi = String(value.mandi || district).trim();
  return {
    district: district || DEFAULT_LOCATION.district,
    state: state || DEFAULT_LOCATION.state,
    coordinates: value.coordinates || {},
    mandi: mandi || district || DEFAULT_LOCATION.mandi,
  };
}

function loadStoredLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    return raw ? cleanLocation(JSON.parse(raw)) : DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}

export function AppProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) || i18n.language || DEFAULT_LANGUAGE;
      return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });
  const [selectedLocation, setSelectedLocationState] = useState(loadStoredLocation);

  useEffect(() => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selectedLocation));
    } catch {
      // Storage can fail in private windows; the in-memory state still remains authoritative.
    }
  }, [selectedLocation]);

  const setLanguage = useCallback((next) => {
    const lang = SUPPORTED_LANGUAGES.includes(next) ? next : DEFAULT_LANGUAGE;
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Language still changes for this session if localStorage is unavailable.
    }
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), duration);
  }, []);

  const setSelectedLocation = useCallback((next) => {
    setSelectedLocationState(prev => cleanLocation({ ...prev, ...(typeof next === 'string' ? { district: next, mandi: next } : next) }));
  }, []);

  const setLocation = useCallback((next) => {
    setSelectedLocation(next);
  }, [setSelectedLocation]);

  const value = useMemo(() => ({
    toast,
    showToast,
    language,
    setLanguage,
    selectedLocation,
    setSelectedLocation,
    location: selectedLocation.district,
    setLocation,
  }), [toast, showToast, language, setLanguage, selectedLocation, setSelectedLocation, setLocation]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
