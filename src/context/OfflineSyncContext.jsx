import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import useOnlineStatus from '@/hooks/useOnlineStatus'
import {
  OFFLINE_SYNC_EVENT,
  getPendingSyncCount,
  prepareOfflineExperience,
  syncPendingResponses,
} from '@/services/offlineSync'

const OfflineSyncContext = createContext(null)

export function OfflineSyncProvider({ children }) {
  const isOnline = useOnlineStatus()
  const [isReady, setIsReady] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  useEffect(() => {
    let active = true

    async function refreshPending() {
      const pendingCount = await getPendingSyncCount()

      if (active) {
        setPendingSyncCount(pendingCount)
      }
    }

    async function bootstrap() {
      await prepareOfflineExperience()
      await refreshPending()

      if (active) {
        setIsReady(true)
      }
    }

    function handleSyncStateChanged() {
      refreshPending()
    }

    bootstrap()
    window.addEventListener(OFFLINE_SYNC_EVENT, handleSyncStateChanged)

    return () => {
      active = false
      window.removeEventListener(OFFLINE_SYNC_EVENT, handleSyncStateChanged)
    }
  }, [])

  useEffect(() => {
    if (!isReady || !isOnline) {
      return undefined
    }

    let active = true

    async function runSync() {
      setIsSyncing(true)
      const result = await syncPendingResponses()

      if (active) {
        setPendingSyncCount(result.pendingCount)
        if (result.syncedCount > 0 || result.failedCount === 0) {
          setLastSyncedAt(Date.now())
        }
        setIsSyncing(false)
      }
    }

    runSync()

    return () => {
      active = false
    }
  }, [isOnline, isReady])

  const value = useMemo(() => ({
    isOnline,
    isReady,
    isSyncing,
    pendingSyncCount,
    lastSyncedAt,
  }), [isOnline, isReady, isSyncing, pendingSyncCount, lastSyncedAt])

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  )
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext)
  if (!context) {
    throw new Error('useOfflineSync must be used inside OfflineSyncProvider')
  }

  return context
}
