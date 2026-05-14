import { Link } from 'react-router-dom'
import { ChartBarIcon, ChevronRightIcon, SparklesIcon } from '@/components/ui/Icons'
import { SUBJECTS } from '@/data/learningCatalog'
import { useLearningSelection } from '@/context/LearningSelectionContext'

export default function HomePage() {
  const { selection, selectSubject } = useLearningSelection()

  return (
    <div className="container-page">
      <section className="py-8 sm:py-10 animate-slide-up" aria-labelledby="subject-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 badge-primary mb-4">
              <SparklesIcon className="w-3.5 h-3.5" />
              Pick your path
            </div>
            <h1 id="subject-heading" className="text-4xl sm:text-5xl font-display font-bold leading-tight">
              Choose a <span className="text-gradient">subject</span>
            </h1>
          </div>

          {selection.subjectLabel && (
            <div className="glass px-4 py-3 text-sm text-surface-muted">
              Last opened <span className="text-surface-text font-semibold">{selection.subjectLabel}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/progress" className="btn-secondary">
            <ChartBarIcon className="h-4 w-4" />
            View progress dashboard
          </Link>
        </div>
      </section>

      <section aria-label="Subjects" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SUBJECTS.map((subject, index) => {
          const Icon = subject.Icon
          const isActive = selection.subjectId === subject.id

          return (
            <Link
              key={subject.id}
              to={`/subject/${subject.id}`}
              id={`subject-card-${subject.id}`}
              onClick={() => selectSubject(subject)}
              className={`group relative min-h-52 overflow-hidden rounded-2xl border bg-gradient-to-br ${subject.gradient}
                          ${subject.ring} ${isActive ? 'border-primary-400/70' : 'border-surface-border'}
                          p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10 bg-white/5" />
              <div className="absolute bottom-4 right-5 text-7xl font-display font-bold text-surface-text/[0.04]">
                {subject.shortLabel}
              </div>

              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ${subject.accent}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="badge-primary text-xs">{subject.topics}</span>
                </div>

                <div>
                  <h2 className="mb-3 text-2xl font-display font-bold text-surface-text">
                    {subject.label}
                  </h2>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5" aria-hidden="true">
                      {['bg-white/80', 'bg-white/50', 'bg-white/25'].map((dotClass) => (
                        <span key={dotClass} className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-surface-text/80 transition-all group-hover:gap-2">
                      Topics
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
