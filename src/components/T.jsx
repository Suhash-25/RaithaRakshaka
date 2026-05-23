import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Simple in-memory translation cache to prevent duplicate API calls
const translationCache = new Map();

// Helper function to call our backend /api/translate route
export const translateText = async (text, targetLang) => {
  if (!text) return '';
  if (targetLang === 'en') return text;
  
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    // Assuming backend runs on :8001
    const res = await fetch('http://localhost:8001/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_lang: targetLang })
    });
    const data = await res.json();
    const translated = data.translated || text;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
};

export default function T({ children }) {
  const { language } = useApp();
  const [text, setText] = useState(children);

  useEffect(() => {
    if (typeof children !== 'string' || language === 'en') {
      setText(children);
      return;
    }

    let isMounted = true;
    translateText(children, language).then(translated => {
      if (isMounted) setText(translated);
    });

    return () => { isMounted = false; };
  }, [children, language]);

  return <>{text}</>;
}
