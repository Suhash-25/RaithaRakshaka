import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState('Bangalore');

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), duration);
  }, []);

  return (
    <AppContext.Provider value={{ toast, showToast, language, setLanguage, location, setLocation }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
