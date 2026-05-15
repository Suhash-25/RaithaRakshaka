import { useState } from 'react'
import { Lock, ChevronLeft } from 'lucide-react'
/**
 * PINAuthComponent - PIN input modal for student authentication
 * Used for login, switching students, or confirming deletes
 */
export default function PINAuthComponent({
  studentId,
  studentName,
  onSuccess,
  onCancel,
  purpose = 'login', // 'login' | 'switch' | 'delete' | 'export'
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePINChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Max 6 digits
    setPin(value)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    setIsLoading(true)
    try {
      await onSuccess(pin)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const purposeText = {
    login: 'Enter PIN to login',
    switch: 'Enter PIN to switch student',
    delete: 'Enter PIN to confirm deletion',
    export: 'Enter PIN to export data',
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50 backdrop-blur-sm">
      <div className="glass w-full max-w-sm p-8 rounded-2xl border border-surface-border shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Lock size={24} className="text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-text">{purposeText[purpose]}</h2>
            <p className="text-sm text-surface-muted">{studentName}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-surface-text mb-2">
              Student PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={handlePINChange}
              placeholder="••••"
              className="w-full px-4 py-3 bg-surface-card border border-surface-border rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-surface-muted mt-1">
              {pin.length} / 6 digits
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-surface-card border border-surface-border text-surface-text rounded-lg hover:bg-surface-border transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
