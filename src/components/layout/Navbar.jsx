import { Link, useLocation } from 'react-router-dom'
import { useOfflineSync } from '@/context/OfflineSyncContext'
import { useStudent } from '@/context/StudentContext'
import useOnlineStatus from '@/hooks/useOnlineStatus'
import {
  ArrowPathIcon,
  ChartBarIcon,
  ClipboardCheckIcon,
  HomeIcon,
  WifiOffIcon,
} from '../ui/Icons'
import { Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import LanguageSwitcher from '@/components/language/LanguageSwitcher'
import StudentSwitcher from '@/components/student/StudentSwitcher'
import logoImage from '@/assets/logo.png'

/**
 * Navbar - top navigation bar with logo, nav links, and sync-aware status indicator.
 */
export default function Navbar() {
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const { isSyncing, pendingSyncCount } = useOfflineSync()
  const { currentStudent } = useStudent()

  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleTheme() {
    setIsDarkMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  const links = [
    { to: '/selection', label: 'Home', Icon: HomeIcon },
    { to: '/progress', label: 'Progress', Icon: ChartBarIcon },
    { to: '/teacher-validation', label: 'Review', Icon: ClipboardCheckIcon },
  ]

  const statusTitle = !isOnline
    ? 'Offline - using cached content'
    : isSyncing
      ? 'Syncing offline work'
      : pendingSyncCount > 0
        ? `${pendingSyncCount} item${pendingSyncCount === 1 ? '' : 's'} waiting to sync`
        : 'Online'

  const statusClass = !isOnline
    ? 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose'
    : isSyncing
      ? 'bg-surface-card border-primary-500 text-primary-300'
      : pendingSyncCount > 0
        ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber'
        : 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal'

  // Get initials for student avatar
  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/selection" className="flex items-center gap-3 group" id="nav-logo">
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-md group-hover:scale-110 transition-transform duration-200 overflow-hidden">
            <img src={logoImage} alt="Pragna Vistara Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-xl text-primary-500 tracking-tight">Pragna Vistara</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ to, label, Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  id={`nav-link-${label.toLowerCase()}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                              transition-all duration-200
                              ${active
                                ? 'bg-primary-500 text-white'
                                : 'text-surface-muted hover:text-surface-text hover:bg-surface-card'
                              }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          <div
            id="online-status-indicator"
            title={statusTitle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        border transition-all duration-300 ${statusClass}`}
          >
            {!isOnline && <><WifiOffIcon className="w-3 h-3" />Offline</>}
            {isOnline && isSyncing && <><ArrowPathIcon className="w-3 h-3 animate-spin" />Syncing</>}
            {isOnline && !isSyncing && pendingSyncCount > 0 && (
              <><span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse-slow" />{pendingSyncCount} pending</>
            )}
            {isOnline && !isSyncing && pendingSyncCount === 0 && (
              <><span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse-slow" />Online</>
            )}
          </div>

          <LanguageSwitcher compact />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-surface-card border border-surface-border text-surface-muted hover:text-surface-text hover:border-primary-500 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Student Switcher / Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-surface-border">
            {currentStudent ? (
              <>
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500 flex items-center justify-center text-primary-500 text-sm font-semibold">
                  {getInitials(currentStudent.name)}
                </div>
                <StudentSwitcher />
              </>
            ) : (
              <button
                onClick={() => (window.location.href = '/login')}
                className="text-sm font-medium text-surface-muted hover:text-primary-500 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-surface/90 backdrop-blur-md pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map(({ to, label, Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={`mobile-${to}`}
                to={to}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors
                  ${active ? 'text-primary-500' : 'text-surface-muted hover:text-surface-text'}
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-500' : ''}`} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
