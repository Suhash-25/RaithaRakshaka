import { Languages } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, languages } = useLanguage()

  return (
    <label className={`inline-flex items-center gap-2 ${compact ? '' : 'rounded-full border border-surface-border bg-surface-card px-3 py-1.5'}`}>
      <Languages size={16} className="text-primary-500" aria-hidden="true" />
      <span className="sr-only">Language</span>
      {!compact && <span className="text-xs font-semibold text-surface-muted">Language</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="bg-transparent text-sm font-medium text-surface-text outline-none"
        aria-label="Language"
      >
        {languages.map((entry) => (
          <option key={entry.code} value={entry.code} className="bg-surface text-surface-text">
            {entry.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
