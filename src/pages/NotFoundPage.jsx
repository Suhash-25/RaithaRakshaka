import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@/components/ui/Icons'

/**
 * NotFoundPage — 404 fallback for unmatched routes.
 */
export default function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="text-7xl font-display font-bold text-gradient mb-4">404</p>
      <h1 className="text-2xl font-semibold text-surface-text mb-3">Page Not Found</h1>
      <p className="text-surface-muted mb-8 max-w-sm">
        The page you're looking for doesn't exist. Let's get you back on track.
      </p>
      <Link to="/selection" id="404-home-link" className="btn-primary">
        <ArrowLeftIcon className="w-4 h-4" />
        Go to Home
      </Link>
    </div>
  )
}
