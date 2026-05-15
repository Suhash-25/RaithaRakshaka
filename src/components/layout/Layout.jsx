import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import OfflineBanner from '../ui/OfflineBanner'

/**
 * Layout — wraps every page with Navbar and offline detection banner.
 * <Outlet /> is filled by the matched child route.
 */
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <OfflineBanner />
      <Navbar />
      <main className="flex-1 animate-fade-in pb-16 sm:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
