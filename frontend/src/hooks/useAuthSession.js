/**
 * useAuthSession.js
 *
 * Initialises a Google ADK session for the current user.
 * No JWT/auth required: chat and planner endpoints are open (no Depends auth).
 * The sessionId is stored in localStorage and reused across page loads.
 */

import { useState, useEffect } from 'react'

const TOKEN_KEY = 'access_token'
const ADK_SESSION_KEY = 'adk_session_id'
const ADK_USER_KEY = 'adk_user_id'

// helpers
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADK_SESSION_KEY)
  localStorage.removeItem(ADK_USER_KEY)
}
export function getAdkSession() {
  return {
    sessionId: localStorage.getItem(ADK_SESSION_KEY) || null,
    userId: localStorage.getItem(ADK_USER_KEY) || null,
  }
}

function saveAdkSession(sessionId, userId) {
  if (sessionId) localStorage.setItem(ADK_SESSION_KEY, sessionId)
  if (userId) localStorage.setItem(ADK_USER_KEY, userId)
}

// ADK session bootstrap — no token needed
async function initAdkSession() {
  const { sessionId, userId } = getAdkSession()
  const uid = userId || 'user'

  try {
    // Try to reuse existing session
    if (sessionId) {
      const res = await fetch('/apps/agent/users/' + uid + '/sessions')
      if (res.ok) {
        const data = await res.json()
        const sessions = Array.isArray(data) ? data : (data.sessions || [])
        if (sessions.some(function(s) { return s.id === sessionId })) {
          return { sessionId: sessionId, userId: uid }
        }
      }
    }

    // Create new session
    const createRes = await fetch('/apps/agent/users/' + uid + '/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })

    if (createRes.ok) {
      const created = await createRes.json()
      const newSessionId = created.id || created.session_id || created.sessionId
      saveAdkSession(newSessionId, uid)
      return { sessionId: newSessionId, userId: uid }
    }
  } catch (e) {
    console.warn('[useAuthSession] ADK session init failed:', e.message)
  }

  return { sessionId: null, userId: uid }
}

// main hook
export default function useAuthSession(_student, appMode) {
  const [token] = useState(getToken)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialising, setIsInitialising] = useState(true)
  const [adkSession, setAdkSessionState] = useState(getAdkSession)
  const [error, setError] = useState(null)

  useEffect(function() {
    if (appMode !== 'online') {
      setIsAuthenticated(false)
      setIsInitialising(false)
      return
    }

    var cancelled = false

    async function bootstrap() {
      setIsInitialising(true)
      try {
        const session = await initAdkSession()
        if (!cancelled) {
          setAdkSessionState(session)
          setIsAuthenticated(!!session.sessionId)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setIsAuthenticated(false)
        }
      } finally {
        if (!cancelled) setIsInitialising(false)
      }
    }

    bootstrap()
    return function() { cancelled = true }
  }, [appMode])

  return { token, isAuthenticated, isInitialising, adkSession, error }
}
