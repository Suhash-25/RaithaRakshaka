import { useOfflineSync } from '@/context/OfflineSyncContext'
import useOnlineStatus from '@/hooks/useOnlineStatus'
import { ArrowPathIcon, WifiOffIcon } from './Icons'

/**
 * OfflineBanner - shows offline and sync state at the top of the viewport.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const { isSyncing, pendingSyncCount } = useOfflineSync()
  const showSyncBanner = isOnline && isSyncing
  const shouldShow = !isOnline || showSyncBanner

  return (
    <div
      id="offline-banner"
      role="alert"
      aria-live="polite"
      className={`overflow-hidden transition-all duration-500 ease-in-out
                  ${shouldShow ? 'max-h-12' : 'max-h-0'}`}
    >
      {!isOnline && (
        <div
          className="bg-accent-rose/90 backdrop-blur-sm text-surface-text text-sm font-medium
                     flex items-center justify-center gap-2 py-2.5"
        >
          <WifiOffIcon className="w-4 h-4 shrink-0" />
          Offline mode is active. Questions, explanations, and progress stay local
          {pendingSyncCount > 0 ? `, with ${pendingSyncCount} item${pendingSyncCount === 1 ? '' : 's'} waiting to sync.` : '.'}
        </div>
      )}

      {showSyncBanner && (
        <div
          className="bg-accent-teal/90 backdrop-blur-sm text-slate-950 text-sm font-semibold
                     flex items-center justify-center gap-2 py-2.5"
        >
          <ArrowPathIcon className="w-4 h-4 shrink-0 animate-spin" />
          Syncing your offline work now that the connection is back.
        </div>
      )}
    </div>
  )
}
