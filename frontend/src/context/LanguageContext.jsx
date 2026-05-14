import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getLanguageMeta, SUPPORTED_LANGUAGES } from '@/utils/translations'

const STORAGE_KEY = 'edu-sakhi-language'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY)
    return SUPPORTED_LANGUAGES.some((entry) => entry.code === savedLanguage) ? savedLanguage : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = getLanguageMeta(language).htmlLang
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      languages: SUPPORTED_LANGUAGES,
      languageMeta: getLanguageMeta(language),
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}
