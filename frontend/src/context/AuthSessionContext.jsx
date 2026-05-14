// @refresh reset
/**
 * AuthSessionContext.jsx
 *
 * Wraps useAuthSession so any component can call:
 *   const { token, isAuthenticated, isInitialising, adkSession } = useAuthSessionCtx()
 *
 * Must be placed INSIDE StudentProvider and AppModeProvider so we can read
 * currentStudent and appMode.
 */

import { createContext, useContext } from 'react'
import { useStudent } from '@/context/StudentContext'
import { useAppMode } from '@/context/AppModeContext'
import useAuthSession from '@/hooks/useAuthSession'

const AuthSessionContext = createContext(null)

export function AuthSessionProvider({ children }) {
  const { currentStudent } = useStudent()
  const { appMode } = useAppMode()

  const authSession = useAuthSession(currentStudent, appMode)

  return (
    <AuthSessionContext.Provider value={authSession}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSessionCtx() {
  const ctx = useContext(AuthSessionContext)
  if (!ctx) throw new Error('useAuthSessionCtx must be inside AuthSessionProvider')
  return ctx
}
