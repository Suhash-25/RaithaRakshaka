import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookCopy,
  Clock3,
  FileText,
  Layers3,
  MapPinned,
  Sparkles,
} from 'lucide-react'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import { getQuestionForTopic } from '@/services/offlineContent'
import { resolveTopicContext } from '@/utils/syllabusPractice'
import MagneticFieldLab from '@/components/physics/MagneticFieldLab'

export default function LearningPage() {
  const { topicId } = useParams()
  const { state: locationState } = useLocation()
  const navigate = useNavigate()
  const { selection, selectTopic } = useLearningSelection()

  const topicContext = useMemo(
    () => resolveTopicContext(topicId, locationState ?? {}, selection),
    [locationState, selection, topicId],
  )

  const [question, setQuestion] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(topicContext.topicId))
  const [error, setError] = useState('')
  const showMagneticLab = isMagnetismTopic(topicContext)

  useEffect(() => {
    if (!topicContext.topicId) return
    if (
      selection.topicId === topicContext.topicId &&
      selection.documentId === topicContext.documentId &&
      selection.chapterId === topicContext.chapterId
    ) {
      return
    }

    selectTopic(
      {
        subject_slug: topicContext.subjectId,
        subject_label: topicContext.subjectLabel,
      },
      {
        id: topicContext.topicId,
        label: topicContext.topicLabel,
      },
      topicContext,
    ).catch(() => {
      // Practice should continue even if local selection persistence fails.
    })
  }, [
    selectTopic,
    selection.chapterId,
    selection.documentId,
    selection.topicId,
    topicContext,
  ])

  useEffect(() => {
    let active = true

    async function loadQuestion() {
      setIsLoading(true)
      setError('')

      try {
        const nextQuestion = await getQuestionForTopic(topicId, topicContext)
        if (active) {
          if (nextQuestion) {
            setQuestion(nextQuestion)
          } else {
            setError('No practice prompt is available for this topic yet.')
          }
        }
      } catch {
        if (active) {
          setError('Could not prepare the practice prompt for this topic.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadQuestion()

    return () => {
      active = false
    }
  }, [topicContext, topicId])

  function handleBack() {
    if (topicContext.classSlug && topicContext.subjectId && topicContext.documentId) {
      navigate(`/classes/${topicContext.classSlug}/subjects/${topicContext.subjectId}/documents/${topicContext.documentId}`)
      return
    }

    navigate(-1)
  }

  function handleStartQuestion() {
    navigate(`/topic/${topicId}/question`, {
      state: {
        ...topicContext,
        questionId: question?.id,
        questionText: question?.text,
      },
    })
  }

  return (
    <div className="container-page animate-fade-in">
      <button onClick={handleBack} className="btn-ghost mb-6 pl-0">
        <ArrowLeft size={18} className="mr-1" />
        Back to chapter map
      </button>

      <section className="mb-8 rounded-2xl border border-surface-border bg-surface-card/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {topicContext.classLabel && <span className="badge-primary">{topicContext.classLabel}</span>}
              {topicContext.subjectLabel && <span className="badge-teal">{topicContext.subjectLabel}</span>}
              {topicContext.chapterLabel && <span className="badge-amber">{topicContext.chapterLabel}</span>}
            </div>
            <h1 className="text-3xl font-display font-bold text-surface-text sm:text-4xl">
              {topicContext.topicLabel}
            </h1>
            <p className="mt-3 max-w-3xl text-surface-muted">
              This practice node comes directly from the textbook syllabus tree. We keep the document, chapter, and topic context attached so progress and explanations stay linked to the curriculum source.
            </p>
          </div>

          <div className="grid min-w-[220px] grid-cols-2 gap-3">
            <InfoTile label="Level" value={topicContext.topicLevel ?? '-'} />
            <InfoTile label="Page" value={topicContext.topicPageNumber ?? '-'} />
            <InfoTile label="Question" value={question?.estimatedTime ?? '5 min'} />
            <InfoTile label="Source" value={topicContext.documentId ? 'Syllabus' : 'General'} />
          </div>
        </div>
      </section>

      {showMagneticLab && (
        <MagneticFieldLab className="mb-8" />
      )}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <div className="mb-5 flex items-center gap-2 text-primary-500">
            <Sparkles size={18} />
            <h2 className="text-xl font-semibold text-surface-text">Practice prompt</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-8 w-24" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-5/6" />
              <div className="skeleton h-10 w-4/6" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-4 text-sm text-accent-rose">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-surface-muted">
                <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1">
                  {question?.estimatedTime}
                </span>
                {topicContext.topicPageNumber && (
                  <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1">
                    Page {topicContext.topicPageNumber}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-semibold leading-snug text-surface-text">
                {question?.text}
              </h3>

              <div className="mt-5 rounded-2xl border border-surface-border bg-surface/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-accent-amber">
                  <Clock3 size={16} />
                  <span className="text-sm font-semibold">Hint</span>
                </div>
                <p className="text-sm leading-relaxed text-surface-muted">
                  {question?.hint}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handleStartQuestion} className="btn-primary">
                  Start answering
                  <ArrowRight size={18} />
                </button>
                <button type="button" onClick={handleBack} className="btn-secondary">
                  Review chapter tree
                </button>
              </div>
            </>
          )}
        </article>

        <article className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <h2 className="text-xl font-semibold text-surface-text">Curriculum context</h2>
          <p className="mt-1 text-sm text-surface-muted">
            This practice item stays connected to the original textbook structure.
          </p>

          <div className="mt-5 space-y-3">
            <ContextCard
              icon={FileText}
              label="Document"
              value={topicContext.documentTitle ?? 'Not linked'}
              hint={topicContext.documentId ?? 'No document id'}
            />
            <ContextCard
              icon={Layers3}
              label="Chapter"
              value={topicContext.chapterLabel ?? 'Not linked'}
              hint={topicContext.chapterId ?? 'No chapter id'}
            />
            <ContextCard
              icon={MapPinned}
              label="Topic path"
              value={topicContext.topicPath ?? topicContext.topicLabel}
              hint={topicContext.subjectLabel ?? 'General subject'}
            />
            <ContextCard
              icon={BookCopy}
              label="Question source"
              value={question?.id ?? 'Generated on demand'}
              hint="Saved locally for offline reuse"
            />
          </div>
        </article>
      </section>
    </div>
  )
}

function isMagnetismTopic(topicContext = {}) {
  const subjectNeedle = `${topicContext.subjectId ?? ''} ${topicContext.subjectLabel ?? ''}`.toLowerCase()
  const topicNeedle = [
    topicContext.topicLabel,
    topicContext.topicPath,
    topicContext.chapterLabel,
    topicContext.documentTitle,
  ].filter(Boolean).join(' ').toLowerCase()
  const isPhysics = /physics|science/.test(subjectNeedle)
  const chapterNumber = getChapterNumber(`${topicContext.chapterLabel ?? ''} ${topicContext.topicLabel ?? ''}`)
  const documentNeedle = `${topicContext.classSlug ?? ''} ${topicContext.documentId ?? ''} ${topicContext.documentTitle ?? ''}`.toLowerCase()
  const isClassXiiPhysicsPartOne = /class-xii/.test(documentNeedle) && /physics/.test(documentNeedle) && /part-1|part 1/.test(documentNeedle)

  return isPhysics && (
    /magnet|magnetic|electromagnet|field line|iron filing|iron dust/.test(topicNeedle) ||
    (isClassXiiPhysicsPartOne && [4, 5].includes(chapterNumber))
  )
}

function getChapterNumber(value) {
  const match = String(value ?? '').match(/\b(?:ch|chap|chapter)[-\s]*(\d+)\b/i)
  return match ? Number(match[1]) : null
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-surface-text">{value}</p>
    </div>
  )
}

function ContextCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface">
          <Icon size={18} className="text-primary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.08em] text-surface-muted">{label}</p>
          <p className="mt-1 text-sm font-semibold text-surface-text">{value}</p>
          <p className="mt-1 break-words text-xs text-surface-muted">{hint}</p>
        </div>
      </div>
    </div>
  )
}
