import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChartBarIcon, SparklesIcon, TargetIcon, TrendingUpIcon } from '@/components/ui/Icons'
import { getAllProgressEvents } from '@/utils/indexedDB'
import { buildProgressSnapshot, getSeverityLabel } from '@/utils/progressAnalytics'

function LineChart({ points }) {
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface/40 text-sm text-surface-muted">
        Submit a few answers to see your learning trend.
      </div>
    )
  }

  const width = 560
  const height = 240
  const padding = 24
  const chartHeight = height - padding * 2
  const chartWidth = width - padding * 2

  const plotted = points.map((point, index) => {
    const x = points.length === 1
      ? width / 2
      : padding + (index / (points.length - 1)) * chartWidth
    const y = padding + ((100 - point.masteryScore) / 100) * chartHeight

    return { ...point, x, y }
  })

  const path = plotted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface/40 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Improvement over time">
        {[0, 25, 50, 75, 100].map((score) => {
          const y = padding + ((100 - score) / 100) * chartHeight
          return (
            <g key={score}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" strokeDasharray="4 6" />
              <text x={2} y={y + 4} fill="#94a3b8" fontSize="11">{score}</text>
            </g>
          )
        })}

        <path d={path} fill="none" stroke="#2dd4bf" strokeWidth="4" strokeLinecap="round" />

        {plotted.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="5" fill="#6c63ff" />
            <text x={point.x} y={height - 6} textAnchor="middle" fill="#94a3b8" fontSize="11">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, hint, accentClass }) {
  return (
    <article className="card">
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${accentClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs text-surface-muted">{hint}</span>
      </div>
      <p className="text-sm text-surface-muted">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold text-surface-text">{value}</p>
    </article>
  )
}

export default function ProgressDashboardPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadEvents() {
      const rows = await getAllProgressEvents()
      if (active) {
        setEvents(rows)
        setLoading(false)
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [])

  const snapshot = useMemo(() => buildProgressSnapshot(events), [events])
  const maxMisconceptionCount = snapshot.misconceptionBreakdown[0]?.count ?? 1

  if (loading) {
    return (
      <div className="container-page animate-fade-in">
        <div className="card">
          <div className="skeleton h-8 w-48" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="skeleton h-32" />
            <div className="skeleton h-32" />
            <div className="skeleton h-32" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page animate-fade-in">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 badge-primary">
            <SparklesIcon className="h-3.5 w-3.5" />
            Student dashboard
          </div>
          <h1 className="text-4xl font-display font-bold text-surface-text">
            Progress at a glance
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-surface-muted">
            Local progress tracking from IndexedDB, built around attempts, misconception patterns, and how mastery is moving over time.
          </p>
        </div>
        <Link to="/" className="btn-secondary">
          Practice more
        </Link>
      </header>

      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <MetricCard
          icon={ChartBarIcon}
          label="Questions attempted"
          value={snapshot.attempted}
          hint="All saved locally"
          accentClass="text-primary-500"
        />
        <MetricCard
          icon={TargetIcon}
          label="Average mastery"
          value={`${snapshot.averageMastery}%`}
          hint="Across all attempts"
          accentClass="text-accent-amber"
        />
        <MetricCard
          icon={TrendingUpIcon}
          label="Improvement trend"
          value={`${snapshot.improvement >= 0 ? '+' : ''}${snapshot.improvement}`}
          hint="Latest practice window"
          accentClass="text-accent-teal"
        />
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-surface-text">Improvement over time</h2>
              <p className="mt-1 text-sm text-surface-muted">
                A simple mastery curve from your last eight analyzed responses.
              </p>
            </div>
            <span className="badge-teal">{snapshot.recentTimeline.length} points</span>
          </div>
          <LineChart points={snapshot.recentTimeline} />
        </article>

        <article className="card">
          <div className="mb-5">
            <h2 className="text-xl font-display font-bold text-surface-text">Misconception types</h2>
            <p className="mt-1 text-sm text-surface-muted">
              Most common patterns detected in recent learning.
            </p>
          </div>

          {snapshot.misconceptionBreakdown.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface/40 text-sm text-surface-muted">
              Misconception counts will appear after the first analysis.
            </div>
          ) : (
            <div className="space-y-4">
              {snapshot.misconceptionBreakdown.map((item) => (
                <div key={item.type}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-surface-text">{item.type}</span>
                    <span className="text-surface-muted">{item.count}</span>
                  </div>
                  <div className="progress-track h-3">
                    <div
                      className="progress-fill"
                      style={{ width: `${(item.count / maxMisconceptionCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <article className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-surface-text">Weak areas</h2>
              <p className="mt-1 text-sm text-surface-muted">
                Topics where misconception frequency and lower mastery suggest more practice.
              </p>
            </div>
            <span className="badge-amber">{snapshot.weakAreas.length} tracked topics</span>
          </div>

          <div className="space-y-3">
            {snapshot.weakAreas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-border bg-surface/40 px-4 py-8 text-center text-sm text-surface-muted">
                No weak areas yet. Practice a topic to start building the dashboard.
              </div>
            )}

            {snapshot.weakAreas.map((area) => (
              <div key={area.key} className="rounded-2xl border border-surface-border bg-surface/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-surface-text">{area.topicLabel}</h3>
                      <span className={area.severity === 'high' ? 'badge-rose' : area.severity === 'medium' ? 'badge-amber' : 'badge-teal'}>
                        {getSeverityLabel(area.severity)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-surface-muted">{area.subjectLabel}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-display font-bold text-surface-text">{area.averageScore}%</p>
                    <p className="text-xs text-surface-muted">average mastery</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-surface-muted">Attempts</p>
                    <p className="mt-1 text-lg font-semibold text-surface-text">{area.attempts}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-surface-muted">Top misconception</p>
                    <p className="mt-1 text-sm font-semibold text-surface-text">{area.topMisconception}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-surface-muted">Last practiced</p>
                    <p className="mt-1 text-sm font-semibold text-surface-text">
                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(area.lastPracticedAt))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2 className="text-xl font-display font-bold text-surface-text">Focus next</h2>
          <p className="mt-2 text-sm leading-relaxed text-surface-muted">
            The current top pattern is <span className="font-semibold text-surface-text">{snapshot.topMisconception}</span>. A good next step is to revisit the lowest-scoring topic and answer one fresh question in your own words.
          </p>

          <div className="divider" />

          <div className="space-y-3">
            {snapshot.recentTimeline.slice().reverse().map((point) => (
              <div key={point.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-surface-text">{point.topicLabel}</p>
                  <p className="text-xs text-surface-muted">{point.misconceptionType}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-surface-text">{point.masteryScore}%</p>
                  <p className="text-xs text-surface-muted">{point.label}</p>
                </div>
              </div>
            ))}

            {snapshot.recentTimeline.length === 0 && (
              <div className="rounded-2xl border border-dashed border-surface-border bg-surface/40 px-4 py-8 text-center text-sm text-surface-muted">
                Recent attempts will show up here after analysis runs.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
