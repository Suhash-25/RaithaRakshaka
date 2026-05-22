import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

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
  const [language, setLanguage] = useState('en');
  const [selectedLocation, setSelectedLocationState] = useState(loadStoredLocation);

  useEffect(() => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selectedLocation));
    } catch {
      // Storage can fail in private windows; the in-memory state still remains authoritative.
    }
  }, [selectedLocation]);

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
  }), [toast, showToast, language, selectedLocation, setSelectedLocation, setLocation]);

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
