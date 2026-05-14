/**
 * LoadingSpinner — centered animated spinner with optional label.
 */
export default function LoadingSpinner({ label = 'Loading…', size = 'md' }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-label={label}>
      <div
        className={`${sizeMap[size]} border-2 border-surface-border border-t-primary-500
                    rounded-full animate-spin`}
      />
      {label && (
        <p className="text-surface-muted text-sm animate-pulse-slow">{label}</p>
      )}
    </div>
  )
}
