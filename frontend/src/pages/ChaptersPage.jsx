import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookCopy, LoaderCircle } from 'lucide-react'
import { getSyllabusSubject } from '@/services/api'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import { calculateDocumentCoverage, formatCompactNumber, getSubjectVisual } from '@/utils/syllabus'

export default function ChaptersPage() {
  const navigate = useNavigate()
  const { classSlug: routeClassSlug, subjectSlug: routeSubjectSlug, subjectId } = useParams()
  const { selection, selectSubject } = useLearningSelection()

  const classSlug = routeClassSlug ?? selection.classSlug
  const subjectSlug = routeSubjectSlug ?? subjectId ?? selection.subjectId

  // Redirect Class 12 Physics to the new interactive curriculum
  useEffect(() => {
    if (classSlug === 'class-xii' && subjectSlug === 'physics') {
      navigate('/physics/class-12', { replace: true })
    }
  }, [classSlug, subjectSlug, navigate])

  const [subjectData, setSubjectData] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(classSlug && subjectSlug))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    if (!classSlug || !subjectSlug) {
      setIsLoading(false)
      return undefined
    }

    async function loadSubject() {
      setIsLoading(true)
      setError('')

      try {
        const payload = await getSyllabusSubject(classSlug, subjectSlug)
        if (!cancelled) {
          setSubjectData(payload)
          if (selection.subjectId !== payload.subject_slug || selection.subjectLabel !== payload.subject_label) {
            await selectSubject(payload)
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Could not load the subject view.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSubject()

    return () => {
      cancelled = true
    }
  }, [classSlug, selectSubject, selection.subjectId, selection.subjectLabel, subjectSlug])

  const documents = subjectData?.documents ?? []
  const documentMix = useMemo(() => {
    return documents.reduce(
      (counts, document) => {
        counts[document.document_kind] = (counts[document.document_kind] ?? 0) + 1
        return counts
      },
      { textbook: 0, workbook: 0, reader: 0 },
    )
  }, [documents])
  const maxChapterCount = Math.max(...documents.map((document) => document.chapter_count), 1)
  const subjectVisual = getSubjectVisual(subjectData?.subject_slug, subjectData?.subject_label)
  const SubjectIcon = subjectVisual.Icon

  if (!classSlug || !subjectSlug) {
    return (
      <div className="container-page animate-fade-in">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-surface-text">Choose a subject first</h1>
          <p className="mt-3 text-surface-muted">
            The document and chapter visuals appear after a class and subject are selected.
          </p>
          <button type="button" onClick={() => navigate('/selection')} className="btn-primary mt-6">
            Back to syllabus dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page animate-fade-in">
      <button onClick={() => navigate(`/classes/${classSlug}/subjects`)} className="btn-ghost mb-6 pl-0">
        <ArrowLeft size={18} className="mr-1" />
        Back to subjects
      </button>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${subjectVisual.bg} ${subjectVisual.border}`}>
                <SubjectIcon size={30} className={subjectVisual.accent} />
              </div>
              <div>
                <div className="badge-primary mb-4 inline-flex">{subjectData?.class_label ?? classSlug}</div>
                <h1 className="text-3xl font-display font-bold text-surface-text sm:text-4xl">
                  {subjectData?.subject_label ?? subjectSlug}
                </h1>
                <p className="mt-2 max-w-2xl text-surface-muted">
                  Review every extracted document in this subject, compare chapter density, and open a visual map of the full table of contents.
                </p>
              </div>
            </div>
            {isLoading && <LoaderCircle className="h-5 w-5 animate-spin text-primary-500" />}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Books" value={subjectData?.document_count ?? 0} />
            <MetricCard label="Pages" value={formatCompactNumber(subjectData?.total_pages ?? 0)} />
            <MetricCard label="Chapters" value={formatCompactNumber(subjectData?.chapter_count ?? 0)} />
            <MetricCard label="TOC docs" value={subjectData?.toc_document_count ?? 0} />
          </div>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <h2 className="text-lg font-semibold text-surface-text">Document mix</h2>
          <p className="mt-1 text-sm text-surface-muted">A quick view of how this subject is split across textbooks, readers, and workbooks.</p>

          <div className="mt-5 space-y-3">
            {Object.entries(documentMix).map(([kind, count]) => {
              const share = documents.length ? Math.round((count / documents.length) * 100) : 0
              return (
                <div key={kind}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-surface-text">{kind}</span>
                    <span className="text-surface-muted">{count}</span>
                  </div>
                  <div className="progress-track h-2">
                    <div className="progress-fill" style={{ width: `${share}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          {error}
        </div>
      )}

      <section className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-surface-text">Document coverage</h2>
          <p className="text-sm text-surface-muted">Each card reflects a textbook or workbook extracted from the syllabus dataset.</p>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
              <div className="skeleton mb-4 h-6 w-48" />
              <div className="skeleton mb-3 h-4 w-24" />
              <div className="space-y-2">
                <div className="skeleton h-2 w-full" />
                <div className="skeleton h-2 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => {
            const pageCoverage = calculateDocumentCoverage(document.toc_entry_count, document.page_count)
            const chapterShare = Math.max(10, Math.round((document.chapter_count / maxChapterCount) * 100))

            return (
              <button
                key={document.document_id}
                type="button"
                onClick={() => navigate(`/classes/${classSlug}/subjects/${subjectSlug}/documents/${document.document_id}`)}
                className="w-full rounded-2xl border border-surface-border bg-surface-card/70 p-6 text-left transition-all hover:border-primary-500 hover:shadow-card-hover"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="badge-primary capitalize">{document.document_kind}</span>
                      {document.part_label && <span className="badge-amber">{document.part_label}</span>}
                      <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1 text-xs font-medium text-surface-muted">
                        {document.toc_quality.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="truncate text-2xl font-semibold text-surface-text">{document.document_title}</h3>
                    <p className="mt-2 text-sm text-surface-muted">
                      {document.chapter_count} chapter markers across {document.page_count} pages with {document.toc_entry_count} total TOC entries.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <VisualStat
                        label="Chapter density"
                        value={`${document.chapter_count} chapters`}
                        width={`${chapterShare}%`}
                      />
                      <VisualStat
                        label="Bookmark coverage"
                        value={`${pageCoverage}% intensity`}
                        width={`${pageCoverage}%`}
                      />
                    </div>
                  </div>

                  <div className="grid min-w-[220px] grid-cols-3 gap-3">
                    <StatPill label="Pages" value={document.page_count} />
                    <StatPill label="Entries" value={document.toc_entry_count} />
                    <StatPill label="Size" value={formatCompactNumber(Math.round(document.file_size_bytes / (1024 * 1024)))} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-surface-border pt-4 text-sm">
                  <span className="flex items-center gap-2 text-surface-muted">
                    <BookCopy size={16} />
                    {document.file_name}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary-500">
                    Open chapter map
                    <ArrowRight size={16} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-2xl font-display font-bold text-surface-text">{value}</p>
    </div>
  )
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-3 py-3 text-center">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-surface-text">{value}</p>
    </div>
  )
}

function VisualStat({ label, value, width }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-surface-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="progress-track h-2">
        <div className="progress-fill" style={{ width }} />
      </div>
    </div>
  )
}
