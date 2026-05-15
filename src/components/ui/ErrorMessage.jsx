import { WarningIcon } from './Icons'

/**
 * ErrorMessage — styled error card for displaying caught errors to the user.
 *
 * @param {string}   message  - Human-readable error message
 * @param {Function} onRetry  - Optional retry callback; renders a retry button when provided
 */
export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 p-8 card border-accent-rose/30 text-center max-w-md mx-auto"
    >
      <div className="w-12 h-12 rounded-full bg-accent-rose/10 flex items-center justify-center">
        <WarningIcon className="w-6 h-6 text-accent-rose" />
      </div>
      <div>
        <h3 className="font-semibold text-surface-text mb-1">Oops!</h3>
        <p className="text-surface-muted text-sm">{message}</p>
      </div>
      {onRetry && (
        <button id="error-retry-btn" onClick={onRetry} className="btn-primary text-sm">
          Try Again
        </button>
      )}
    </div>
  )
}
