import { createContext, useContext, useEffect, useState } from 'react'

const AppModeContext = createContext(null)

export function AppModeProvider({ children }) {
  const [appMode, setAppMode] = useState('offline') // default offline
  const [isChecking, setIsChecking] = useState(true)

  const updateMode = (newMode) => {
    setAppMode(newMode)
    localStorage.setItem('appMode', newMode)
  }

  const checkMode = async () => {
    try {
      const res = await fetch('/api/health') // or /health depending on proxy
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'online' || data.status === 'ok') {
          updateMode('online')
        } else {
          updateMode('offline')
        }
      } else {
        updateMode('offline')
      }
    } catch (e) {
      updateMode('offline')
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkMode()
    const interval = setInterval(checkMode, 30000) // check every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <AppModeContext.Provider value={{ appMode, setAppMode: updateMode, isChecking, checkMode }}>
      {children}
    </AppModeContext.Provider>
  )
}

export function useAppMode() {
  const context = useContext(AppModeContext)
  if (!context) {
    throw new Error('useAppMode must be used inside AppModeProvider')
  }
  return context
}

export default AppModeContext
