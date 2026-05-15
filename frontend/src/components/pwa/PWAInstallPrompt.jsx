import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function PWAInstallPrompt() {
  return null

  const [installEvent, setInstallEvent] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-install-dismissed') === 'true')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const standalone = mediaQuery.matches || window.navigator.standalone === true
    setIsInstalled(standalone)

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallEvent(event)
      setDismissed(false)
    }

    function handleInstalled() {
      setIsInstalled(true)
      setInstallEvent(null)
    }

    function handleUpdateReady() {
      setUpdateReady(true)
    }

    function handleOfflineReady() {
      setOfflineReady(true)
      window.setTimeout(() => setOfflineReady(false), 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('pwa-update-ready', handleUpdateReady)
    window.addEventListener('pwa-offline-ready', handleOfflineReady)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('pwa-update-ready', handleUpdateReady)
      window.removeEventListener('pwa-offline-ready', handleOfflineReady)
    }
  }, [])

  async function handleInstall() {
    if (!installEvent) return

    installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstallEvent(null)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (updateReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-primary-500/40 bg-surface-card p-3 shadow-card-hover sm:left-auto">
        <div>
          <p className="text-sm font-semibold text-surface-text">Update ready</p>
          <p className="text-xs text-surface-muted">Reload to use the latest app version.</p>
        </div>
        <button type="button" className="btn-primary px-3 py-2" onClick={() => window.location.reload()}>
          <RefreshCw size={16} />
          Reload
        </button>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md rounded-xl border border-accent-teal/40 bg-surface-card p-3 text-sm font-medium text-surface-text shadow-card-hover sm:left-auto">
        App is ready to work offline.
      </div>
    )
  }

  if (isInstalled || dismissed || !installEvent) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-surface-border bg-surface-card p-3 shadow-card-hover sm:left-auto">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
        <img src="/app-icon.svg" alt="" className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-surface-text">Install Pragna Vistara</p>
        <p className="text-xs text-surface-muted">Add it as an app on this device.</p>
      </div>
      <button type="button" className="btn-primary px-3 py-2" onClick={handleInstall}>
        Install
      </button>
      <button
        type="button"
        className="rounded-full p-2 text-surface-muted transition-colors hover:bg-surface hover:text-surface-text"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
      >
        <X size={16} />
      </button>
    </div>
  )
}
