import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon } from '@/components/ui/Icons'
import { t } from '@/utils/translations'
import { useLanguage } from '@/context/LanguageContext'

const TYPE_BADGE = {
  wrong_concept: 'badge-rose',
  partial_understanding: 'badge-amber',
  conceptual_error: 'badge-rose',
  formula_misuse: 'badge-amber',
  step_error: 'badge-amber',
  derivation_error: 'badge-rose',
  no_misconception: 'badge-teal',
}

export default function ResultPage() {
  const { state } = useLocation()
  const { language } = useLanguage()
  const detection = state?.detection
  const answer = state?.answer
  const topicLabel = state?.topicLabel ?? 'this topic'
  const topicId    = state?.topicId    ?? ''

  // Fallback for simple results (if detection is missing)
  const responses = state?.responses ?? []
  const correct = responses.filter((r) => r.isCorrect).length
  const total = responses.length
  const scorePct = total > 0 ? Math.round((correct / total) * 100) : (detection?.confidence || 0)

  const scoreConfig = (() => {
    if (scorePct >= 80) return { label: 'Excellent!', color: 'text-accent-teal', ring: 'stroke-accent-teal' }
    if (scorePct >= 50) return { label: 'Good effort!', color: 'text-accent-amber', ring: 'stroke-accent-amber' }
    return { label: 'Keep trying!', color: 'text-accent-rose', ring: 'stroke-accent-rose' }
  })()

  return (
    <div className="container-page max-w-3xl animate-fade-in">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge-primary mb-4">
          <SparklesIcon className="w-3.5 h-3.5" />
          Session Complete
        </div>
        <h1 className="font-display font-bold text-3xl text-surface-text mb-2">
          Results for <span className="text-primary-500">{topicLabel}</span>
        </h1>
        <p className="text-surface-muted text-sm">
          Here's how you performed and where to focus next.
        </p>
      </header>

      {detection ? (
        <section className="card mb-6 overflow-hidden">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-border pb-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-surface-muted">
                {t(language, 'ui', 'misconception_label')}
              </p>
              <span className={`badge ${TYPE_BADGE[detection.misconception_type] || 'badge-primary'}`}>
                {t(language, 'misconception_types', detection.misconception_type)}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-surface-muted">Confidence</p>
              <p className={`text-3xl font-display font-bold ${scoreConfig.color}`}>{scorePct}%</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-5">
              <div className="mb-3 flex items-center gap-2 text-primary-500">
                {detection.misconception_type === 'no_misconception'
                  ? <CheckCircleIcon className="h-5 w-5 text-accent-teal" />
                  : <SparklesIcon className="h-5 w-5" />}
                <h2 className="font-semibold text-surface-text">{t(language, 'ui', 'explanation_label')}</h2>
              </div>
              <p className="text-sm leading-relaxed text-surface-muted">{detection.explanation}</p>
            </article>

            <article className="rounded-2xl border border-surface-border bg-surface/40 p-5">
              <h2 className="mb-3 font-semibold text-surface-text">{t(language, 'ui', 'suggestion_label')}</h2>
              <span className="badge-teal">{t(language, 'suggestions', detection.suggestion) || detection.suggestion}</span>
              {detection.textbooks && detection.textbooks.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-surface-muted">
                    Syllabus sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detection.textbooks.map((book) => (
                      <span key={book} className="badge-primary text-[10px]">{book}</span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        </section>
      ) : (
        <div className="card text-center py-12 mb-6">
           <p className="text-surface-muted mb-4">Detailed analysis for this topic is loading...</p>
           <div className="flex justify-center gap-1">
             <div className="skeleton h-2 w-2 rounded-full animate-pulse" />
             <div className="skeleton h-2 w-2 rounded-full animate-pulse delay-75" />
             <div className="skeleton h-2 w-2 rounded-full animate-pulse delay-150" />
           </div>
        </div>
      )}

      {detection?.visual && (
        <section className="card mb-6">
          <h2 className="mb-4 font-semibold text-surface-text">{t(language, 'ui', 'visual_label')}</h2>
          {detection.visual.svg ? (
            <div
              className="overflow-hidden rounded-2xl border border-surface-border bg-surface/40 p-4"
              dangerouslySetInnerHTML={{ __html: detection.visual.svg }}
            />
          ) : (
            <img src={detection.visual.image_url} alt="" className="w-full rounded-2xl border border-surface-border" />
          )}
          {detection.visual.caption && (
            <p className="mt-3 text-xs leading-relaxed text-surface-muted">{detection.visual.caption}</p>
          )}
        </section>
      )}

      {answer?.answerText && (
        <section className="mb-8 rounded-2xl border border-surface-border bg-surface/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-surface-text">Your answer</span>
            <span className="badge-teal text-[10px]">{language.toUpperCase()}</span>
          </div>
          <p className="text-sm italic text-surface-muted leading-relaxed">
            "{answer.answerText}"
          </p>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
        <Link to="/" id="back-home-result" className="btn-secondary">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Subjects
        </Link>
        {topicId && (
          <Link
            to={`/topic/${topicId}/question`}
            id="retry-topic-btn"
            state={{ topicLabel }}
            className="btn-primary"
          >
            Retry Topic
          </Link>
        )}
      </div>
    </div>
  )
}
