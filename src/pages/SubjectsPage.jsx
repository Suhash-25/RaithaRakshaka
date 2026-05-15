import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LoaderCircle, Search } from 'lucide-react'
import { getSyllabusClass } from '@/services/api'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import { formatCompactNumber, getSubjectVisual } from '@/utils/syllabus'
import { hasCatalog } from '@/data/catalogRegistry'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const { classSlug: routeClassSlug } = useParams()
  const { selection, selectClass, selectSubject } = useLearningSelection()

  const classSlug = routeClassSlug ?? selection.classSlug

  const [searchQuery, setSearchQuery] = useState('')
  const [classData, setClassData] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(classSlug))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    if (!classSlug) {
      setClassData(null)
      setIsLoading(false)
      return undefined
    }

    async function loadClassData() {
      setIsLoading(true)
      setError('')

      try {
        const payload = await getSyllabusClass(classSlug)
        if (!cancelled) {
          setClassData(payload)
          await selectClass(
            {
              class_slug: payload.class_slug,
              class_label: payload.class_label,
            },
            selection.boardId ? { id: selection.boardId, label: selection.boardLabel } : null,
          )
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Could not load this class syllabus.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadClassData()

    return () => {
      cancelled = true
    }
  }, [classSlug, selectClass, selection.boardId, selection.boardLabel])

  const subjects = classData?.subjects ?? []
  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return subjects
    return subjects.filter((subject) => {
      const label = `${subject.subject_label} ${subject.documents.map((document) => document.document_title).join(' ')}`.toLowerCase()
      return label.includes(query)
    })
  }, [searchQuery, subjects])

  const maxPages = Math.max(...subjects.map((subject) => subject.total_pages), 1)
  const topSubjects = subjects.slice().sort((left, right) => right.total_pages - left.total_pages).slice(0, 5)

  async function handleOpenSubject(subject) {
    await selectSubject(subject)
    
    // Map class slugs to catalog classIds
    const registryClassId = classSlug === 'class-xii' ? 'class-12' : 
                            classSlug === 'class-xi' ? 'class-11' :
                            classSlug === 'class-x' ? 'class-10' :
                            classSlug === 'class-ix' ? 'class-09' : classSlug

    // Intercept subjects that have an interactive catalog
    if (hasCatalog(registryClassId, subject.subject_slug)) {
      navigate(`/learn/${registryClassId}/${subject.subject_slug}`)
      return
    }

    navigate(`/classes/${classSlug}/subjects/${subject.subject_slug}`)
  }

  if (!classSlug) {
    return (
      <div className="container-page animate-fade-in">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-surface-text">Choose a class first</h1>
          <p className="mt-3 text-surface-muted">
            The subject visuals need a class context before they can load.
          </p>
          <Link to="/selection" className="btn-primary mt-6">
            Back to class dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page animate-fade-in">
      <button onClick={() => navigate('/selection')} className="btn-ghost mb-6 pl-0">
        <ArrowLeft size={18} className="mr-1" />
        Back to classes
      </button>

      <section className="mb-8">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-surface-text sm:text-4xl">
                {classData?.class_label ?? classSlug} Subjects
              </h1>
              <p className="mt-2 max-w-2xl text-surface-muted">
                Open any subject to inspect textbooks, workbooks, and chapter maps.
              </p>
            </div>
            {isLoading && <LoaderCircle className="h-5 w-5 animate-spin text-primary-500" />}
          </div>
        </div>
      </section>

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-text">Browse subjects</h2>
          <p className="text-sm text-surface-muted">Search by subject or textbook title.</p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-surface-border bg-surface-card/70 p-5">
              <div className="skeleton mb-4 h-6 w-32" />
              <div className="skeleton mb-3 h-4 w-20" />
              <div className="space-y-2">
                <div className="skeleton h-2 w-full" />
                <div className="skeleton h-2 w-5/6" />
                <div className="skeleton h-2 w-4/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-10 text-center text-surface-muted">
          No subjects matched "{searchQuery}".
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const visual = getSubjectVisual(subject.subject_slug, subject.subject_label)
            const Icon = visual.Icon
            const pageShare = Math.max(12, Math.round((subject.total_pages / maxPages) * 100))
            const documentKinds = countDocumentKinds(subject.documents)

            return (
              <button
                key={subject.subject_slug}
                type="button"
                onClick={() => handleOpenSubject(subject)}
                className="group rounded-2xl border border-surface-border bg-surface-card/70 p-5 text-left transition-all hover:-translate-y-1 hover:border-primary-500 hover:shadow-card-hover"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${visual.bg} ${visual.border}`}>
                    <Icon size={28} className={visual.accent} />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-surface-text transition-colors group-hover:text-primary-500">
                  {subject.subject_label}
                </h3>
                <p className="mt-2 text-sm text-surface-muted">
                  {subject.document_count} books | {subject.chapter_count} chapters
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-surface-border pt-4 text-sm">
                  <span className="truncate text-surface-muted">
                    {subject.documents.slice(0, 2).map((document) => document.document_title).join(' | ')}
                  </span>
                  <span className="ml-3 inline-flex items-center gap-1 font-semibold text-primary-500">
                    Open
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

function StatChip({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-surface-text">{value}</p>
    </div>
  )
}

function countDocumentKinds(documents) {
  return documents.reduce(
    (counts, document) => {
      counts[document.document_kind] = (counts[document.document_kind] ?? 0) + 1
      return counts
    },
    { textbook: 0, workbook: 0, reader: 0 },
  )
}
