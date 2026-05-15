import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, LoaderCircle, School2 } from 'lucide-react'
import { getSyllabusCatalog } from '@/services/api'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import { getLevelMeta, getSubjectVisual, groupClassesByLevel } from '@/utils/syllabus'
import { BOARD_META } from '@/data/syllabusBoards'

const BOARDS = [
  { id: 'state', label: 'State Board', enabled: true },
  { id: 'cbse', label: 'CBSE', enabled: true },
]

const EMPTY_LEVEL = { classes: [] }

export default function SelectionPage() {
  const navigate = useNavigate()
  const { selection, selectClass } = useLearningSelection()

  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBoard, setSelectedBoard] = useState(selection.boardId ?? 'state')
  const [selectedLevel, setSelectedLevel] = useState(
    selection.classLabel ? getLevelMeta(selection.classLabel).id : 'primary',
  )
  const [selectedClassSlug, setSelectedClassSlug] = useState(selection.classSlug)

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setIsLoading(true)
      setError('')

      try {
        const nextCatalog = await getSyllabusCatalog(selectedBoard)
        if (!cancelled) {
          setCatalog(nextCatalog)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message ?? 'Could not load the syllabus overview.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      cancelled = true
    }
  }, [selectedBoard])

  const levelGroups = useMemo(
    () => groupClassesByLevel(catalog?.classes ?? []),
    [catalog],
  )

  useEffect(() => {
    const activeLevel = levelGroups.find((level) => level.id === selectedLevel) ?? EMPTY_LEVEL
    if (!activeLevel.classes.length) {
      setSelectedClassSlug(null)
      return
    }

    const currentClassExists = activeLevel.classes.some((classItem) => classItem.class_slug === selectedClassSlug)
    if (!currentClassExists) {
      setSelectedClassSlug(activeLevel.classes[0].class_slug)
    }
  }, [levelGroups, selectedLevel, selectedClassSlug])

  const activeLevel = levelGroups.find((level) => level.id === selectedLevel) ?? EMPTY_LEVEL
  const selectedClass = activeLevel.classes.find((classItem) => classItem.class_slug === selectedClassSlug) ?? null
  const totalPages = catalog?.total_pages ?? 0

  async function handleContinue() {
    if (!selectedClass) return

    const board = BOARDS.find((entry) => entry.id === selectedBoard) ?? BOARDS[0]
    await selectClass(selectedClass, board)
    navigate(`/classes/${selectedClass.class_slug}/subjects`)
  }

  return (
    <div className="container-page animate-fade-in pb-32">
      <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-surface-text sm:text-5xl">
            Syllabus Curriculum
          </h1>
          <p className="mt-3 max-w-3xl text-surface-muted">
            Pick State or CBSE, then open a class to browse only that board's syllabus.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-surface-border bg-surface-card/70 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-surface-text">Board</p>
            <p className="mt-1 text-sm text-surface-muted">
              {BOARD_META[selectedBoard]?.description ?? 'Choose the syllabus board before selecting a class.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {BOARDS.map((board) => (
              <button
                key={board.id}
                type="button"
                disabled={!board.enabled}
                onClick={() => board.enabled && setSelectedBoard(board.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  selectedBoard === board.id
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : board.enabled
                      ? 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text hover:border-primary-500'
                      : 'cursor-not-allowed border-surface-border bg-surface-card text-surface-muted'
                }`}
              >
                {board.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          {error}
        </div>
      )}

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-text">Levels</h2>
              <p className="text-sm text-surface-muted">Jump into a band of classes and compare coverage.</p>
            </div>
            {isLoading && <LoaderCircle className="h-4 w-4 animate-spin text-primary-500" />}
          </div>

          <div className="space-y-3">
            {levelGroups.map((level) => {
              const pages = level.classes.reduce((sum, classItem) => sum + classItem.total_pages, 0)
              const pageShare = totalPages ? Math.round((pages / totalPages) * 100) : 0
              const active = selectedLevel === level.id

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedLevel(level.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-border bg-surface-card hover:border-primary-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${level.accent}`}>{level.label}</p>
                      <p className="mt-1 text-sm text-surface-muted">
                        {level.range[0]} to {level.range[1]}
                      </p>
                    </div>
                  </div>

                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-text">Classes</h2>
              <p className="text-sm text-surface-muted">Select one class to open the full subject breakdown and chapter visuals.</p>
            </div>
            {selectedClass && (
              <span className="badge-teal">
                <School2 size={14} />
                {selectedClass.class_label}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-surface-border bg-surface p-5">
                  <div className="skeleton mb-3 h-5 w-24" />
                  <div className="skeleton mb-6 h-4 w-16" />
                  <div className="space-y-3">
                    <div className="skeleton h-2 w-full" />
                    <div className="skeleton h-2 w-5/6" />
                    <div className="skeleton h-2 w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeLevel.classes.map((classItem) => {
                const pageShare = totalPages ? Math.round((classItem.total_pages / totalPages) * 100) : 0
                const subjectPreview = classItem.subjects
                  .slice()
                  .sort((left, right) => right.total_pages - left.total_pages)
                  .slice(0, 3)
                const active = classItem.class_slug === selectedClassSlug

                return (
                  <button
                    key={classItem.class_slug}
                    type="button"
                    onClick={() => setSelectedClassSlug(classItem.class_slug)}
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      active
                        ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_0_2px_rgba(108,99,255,0.2)]'
                        : 'border-surface-border bg-surface-card hover:border-primary-500'
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-display font-bold text-surface-text">{classItem.class_label}</p>
                        <p className="mt-1 text-sm text-surface-muted">
                          {classItem.subject_count} subjects
                        </p>
                      </div>
                      {active && <CheckCircle2 className="h-5 w-5 text-primary-500" />}
                    </div>

                    <div className="space-y-2">
                      {subjectPreview.map((subject) => {
                        const visual = getSubjectVisual(subject.subject_slug, subject.subject_label)
                        const share = classItem.total_pages ? Math.max(8, Math.round((subject.total_pages / classItem.total_pages) * 100)) : 0

                        return (
                          <div key={subject.subject_slug} className="flex items-center gap-3 text-sm">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${visual.bg} ${visual.accent}`}>
                              <visual.Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-surface-text">{subject.subject_label}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface-card/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-surface-text">Open the selected class</h2>
          <p className="text-sm text-surface-muted">
            Continue into subject distribution, document coverage, and chapter maps for {selectedClass?.class_label ?? 'the selected class'}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedClass}
          className="btn-primary"
        >
          View Subjects
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-2xl font-display font-bold text-surface-text">{value}</p>
    </div>
  )
}

function CompactStat({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-surface-text">{value}</p>
    </div>
  )
}
