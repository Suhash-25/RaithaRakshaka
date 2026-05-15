import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getProgressEventsByStudent } from '@/utils/indexedDB'
import { useStudent } from '@/context/StudentContext'

// ── Tiny SVG line chart ───────────────────────────────────────────────────────
function SparkLine({ data, color = '#6c63ff', height = 56 }) {
  if (!data || data.length < 2) return null
  const w = 200, h = height, pad = 4
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const path = `M ${pts.join(' L ')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w - pad},${h} L ${pad},${h} Z`}
        fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ correct, wrong, size = 120 }) {
  const total = correct + wrong
  if (total === 0) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="rounded-full border-4 border-dashed border-surface-border" style={{ width: size * 0.8, height: size * 0.8 }} />
    </div>
  )
  const r = 46, cx = 60, cy = 60
  const circumference = 2 * Math.PI * r
  const correctPct = correct / total
  const correctDash = correctPct * circumference
  const wrongDash = (wrong / total) * circumference
  const gap = 3
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        {/* wrong arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f43f5e" strokeWidth="12"
          strokeDasharray={`${wrongDash - gap} ${circumference - wrongDash + gap}`}
          strokeDashoffset={-(correctDash + gap / 2)}
          strokeLinecap="round" transform="rotate(-90 60 60)" />
        {/* correct arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth="12"
          strokeDasharray={`${correctDash - gap} ${circumference - correctDash + gap}`}
          strokeLinecap="round" transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-display font-bold text-surface-text">{Math.round(correctPct * 100)}%</p>
        <p className="text-[10px] text-surface-muted">accuracy</p>
      </div>
    </div>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data.length) return (
    <div className="flex h-32 items-center justify-center text-sm text-surface-muted">
      No data yet. Complete a quiz to see your performance.
    </div>
  )
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-[9px] text-surface-muted font-mono">{d.value}</span>
          <div className="w-full rounded-t-lg transition-all duration-700"
            style={{
              height: `${(d.value / maxVal) * 100}px`,
              background: d.color ?? 'linear-gradient(180deg,#6c63ff,#2dd4bf)',
              minHeight: d.value > 0 ? 4 : 0,
            }} />
          <span className="text-[9px] text-surface-muted truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, accentClass = 'text-primary-500', sparkData, sparkColor }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`text-2xl`}>{emoji}</div>
        {sparkData && <SparkLine data={sparkData} color={sparkColor} height={40} />}
      </div>
      <div>
        <p className="text-xs text-surface-muted uppercase tracking-widest">{label}</p>
        <p className={`mt-1 text-3xl font-display font-bold ${accentClass}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-surface-muted">{sub}</p>}
      </div>
    </div>
  )
}

// ── Prediction badge ──────────────────────────────────────────────────────────
function PredictBadge({ level }) {
  const cfg = {
    high:   { label: 'On Track 🚀', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
    medium: { label: 'Improving 📈', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' },
    low:    { label: 'Needs Practice ⚠️', cls: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' },
  }
  const { label, cls } = cfg[level] ?? cfg.medium
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>
}

// ── Main analytics builder ────────────────────────────────────────────────────
function buildAnalytics(events) {
  const sorted = [...events].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
  const totalSessions = sorted.length
  const totalQuestions = sorted.reduce((s, e) => s + (e.totalQuestions ?? 1), 0)
  const totalCorrect   = sorted.reduce((s, e) => s + (e.correctAnswers ?? 0), 0)
  const totalWrong     = sorted.reduce((s, e) => s + (e.wrongAnswers ?? 0), 0)
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  // Per-subject breakdown
  const subjectMap = new Map()
  for (const e of sorted) {
    const key = e.subjectLabel ?? e.subjectId ?? 'Unknown'
    const s = subjectMap.get(key) ?? { label: key, sessions: 0, correct: 0, wrong: 0, total: 0, scores: [] }
    s.sessions += 1
    s.correct  += e.correctAnswers ?? 0
    s.wrong    += e.wrongAnswers   ?? 0
    s.total    += e.totalQuestions ?? 1
    s.scores.push(e.scorePct ?? e.masteryScore ?? 0)
    subjectMap.set(key, s)
  }
  const subjectBreakdown = [...subjectMap.values()].map(s => ({
    ...s,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    avgScore: s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0,
  })).sort((a, b) => b.sessions - a.sessions)

  // Per-topic breakdown
  const topicMap = new Map()
  for (const e of sorted) {
    const key = e.topicLabel ?? e.topicId ?? 'General'
    const t = topicMap.get(key) ?? { label: key, subject: e.subjectLabel ?? '', sessions: 0, correct: 0, wrong: 0, total: 0, scores: [] }
    t.sessions += 1
    t.correct  += e.correctAnswers ?? 0
    t.wrong    += e.wrongAnswers   ?? 0
    t.total    += e.totalQuestions ?? 1
    t.scores.push(e.scorePct ?? e.masteryScore ?? 0)
    topicMap.set(key, t)
  }
  const topicBreakdown = [...topicMap.values()].map(t => ({
    ...t,
    accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  })).sort((a, b) => a.accuracy - b.accuracy)

  // Score trend (last 10 sessions)
  const recentScores = sorted.slice(-10).map(e => e.scorePct ?? e.masteryScore ?? 0)
  const improvement = recentScores.length >= 2
    ? recentScores[recentScores.length - 1] - recentScores[0]
    : 0

  // Session history (last 8)
  const sessionHistory = sorted.slice(-8).reverse().map((e, i) => ({
    id: e.id ?? i,
    topicLabel: e.topicLabel ?? 'Quiz',
    subjectLabel: e.subjectLabel ?? '',
    totalQ: e.totalQuestions ?? 1,
    correct: e.correctAnswers ?? 0,
    wrong: e.wrongAnswers ?? 0,
    score: e.scorePct ?? e.masteryScore ?? 0,
    date: e.createdAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(e.createdAt)) : '—',
  }))

  // Predictive performance level
  const avgRecent = recentScores.length
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 0
  const predictLevel = avgRecent >= 70 ? 'high' : avgRecent >= 45 ? 'medium' : 'low'

  // Bar chart data per subject
  const subjectBarData = subjectBreakdown.slice(0, 6).map(s => ({
    label: String(s.label || 'Unknown').split(' ').slice(-1)[0], // last word
    value: s.accuracy,
    color: s.accuracy >= 70 ? '#10b981' : s.accuracy >= 45 ? '#f59e0b' : '#f43f5e',
  }))

  return {
    totalSessions, totalQuestions, totalCorrect, totalWrong, overallAccuracy,
    subjectBreakdown, topicBreakdown, recentScores, improvement, sessionHistory,
    predictLevel, subjectBarData,
    weakTopics: topicBreakdown.filter(t => t.accuracy < 60).slice(0, 4),
    strongTopics: [...topicBreakdown].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProgressDashboardPage() {
  const { currentStudent } = useStudent()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [recs, setRecs] = useState(null)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const intervalRef = useRef(null)

  async function loadEvents() {
    const studentId = currentStudent?.id || 'guest'
    const rows = await getProgressEventsByStudent(studentId)
    setEvents(rows)
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
    // Live refresh every 5 s so new quiz results show instantly
    intervalRef.current = setInterval(loadEvents, 5000)
    return () => clearInterval(intervalRef.current)
  }, [currentStudent?.id])

  const analytics = useMemo(() => buildAnalytics(events), [events])

  useEffect(() => {
    if (activeTab === 'insights' && !recs && !loadingRecs && events.length > 0) {
      setLoadingRecs(true)
      const payload = {
        student_id: "local_student",
        topic_breakdown: analytics.topicBreakdown.map(t => `${t.label} (${t.accuracy}%)`),
        overall_accuracy: analytics.overallAccuracy,
        weak_topics: analytics.weakTopics.map(t => t.label),
        strong_topics: analytics.strongTopics.map(t => t.label)
      }
      fetch('/api/student/ml-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => setRecs(data.recommendations || []))
        .catch(() => setRecs([]))
        .finally(() => setLoadingRecs(false))
    }
  }, [activeTab, recs, loadingRecs, events.length, analytics])

  if (loading) {
    return (
      <div className="container-page animate-fade-in">
        <div className="grid gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const noData = events.length === 0

  return (
    <div className="container-page animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
          </span>
          Live Analytics
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-surface-text">Progress Dashboard</h1>
            <p className="mt-2 text-sm text-surface-muted">
              Real-time performance across all quizzes and subjects · updates every 5 s
            </p>
          </div>
          <div className="flex gap-2">
            <PredictBadge level={analytics.predictLevel} />
            <Link to="/learn/class-12/physics" className="rounded-xl border border-surface-border bg-surface-card px-4 py-2 text-sm text-surface-muted hover:text-surface-text transition-colors">
              Practice now →
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl border border-surface-border bg-surface-card p-1 w-fit">
          {['overview', 'subjects', 'history', 'insights'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all flex items-center gap-1.5 ${activeTab === tab ? 'bg-primary-500 text-white' : 'text-surface-muted hover:text-surface-text'}`}>
              {tab === 'insights' && <span className="text-[10px]">✨</span>}
              {tab}
            </button>
          ))}
        </div>
      </header>

      {noData ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-20 text-center">
          <div className="mb-4 text-5xl">📊</div>
          <h2 className="text-xl font-display font-bold text-surface-text">No quiz data yet</h2>
          <p className="mt-2 max-w-sm text-sm text-surface-muted">
            Complete a topic's Analysis quiz and your performance will appear here in real time.
          </p>
          <Link to="/learn/class-12/physics" className="btn-primary mt-6">
            Start a quiz →
          </Link>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard emoji="🎯" label="Overall Accuracy" value={`${analytics.overallAccuracy}%`}
                  accentClass={analytics.overallAccuracy >= 70 ? 'text-emerald-500 dark:text-emerald-400' : analytics.overallAccuracy >= 45 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}
                  sparkData={analytics.recentScores} sparkColor="#6c63ff" />
                <StatCard emoji="📝" label="Total Questions" value={analytics.totalQuestions}
                  sub={`${analytics.totalSessions} quiz session${analytics.totalSessions !== 1 ? 's' : ''}`}
                  accentClass="text-primary-500 dark:text-primary-400" />
                <StatCard emoji="✅" label="Correct Answers" value={analytics.totalCorrect}
                  accentClass="text-emerald-500 dark:text-emerald-400"
                  sparkData={analytics.recentScores} sparkColor="#10b981" />
                <StatCard emoji="❌" label="Wrong Answers" value={analytics.totalWrong}
                  accentClass="text-rose-500 dark:text-rose-400"
                  sparkData={analytics.recentScores.map(s => 100 - s)} sparkColor="#f43f5e" />
              </div>

              {/* Charts row */}
              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                {/* Score trend */}
                <div className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-display font-bold text-surface-text">Score Trend</h2>
                      <p className="text-xs text-surface-muted">Last {analytics.recentScores.length} sessions</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${analytics.improvement >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                      {analytics.improvement >= 0 ? '↑' : '↓'} {Math.abs(analytics.improvement)}pts
                    </span>
                  </div>
                  <div className="h-32">
                    {analytics.recentScores.length > 1
                      ? <SparkLine data={analytics.recentScores} color="#6c63ff" height={128} />
                      : <div className="flex h-full items-center justify-center text-sm text-surface-muted">Need 2+ sessions for trend</div>
                    }
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-surface-muted">
                    <span>Oldest →</span><span>← Latest</span>
                  </div>
                </div>

                {/* Accuracy donut */}
                <div className="rounded-2xl border border-surface-border bg-surface-card p-5 flex flex-col items-center gap-4 shadow-sm">
                  <h2 className="text-lg font-display font-bold text-surface-text">Correct vs Wrong</h2>
                  <DonutChart correct={analytics.totalCorrect} wrong={analytics.totalWrong} size={140} />
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Correct ({analytics.totalCorrect})</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Wrong ({analytics.totalWrong})</span>
                  </div>
                </div>
              </div>

              {/* Subject accuracy bars */}
              {analytics.subjectBarData.length > 0 && (
                <div className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-display font-bold text-surface-text">Accuracy by Subject</h2>
                  <BarChart data={analytics.subjectBarData} />
                </div>
              )}

              {/* Weak / Strong split */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Weak topics */}
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                  <h2 className="mb-4 font-display font-bold text-rose-600 dark:text-rose-400">⚠️ Topics Needing Practice</h2>
                  {analytics.weakTopics.length === 0 ? (
                    <p className="text-sm text-surface-muted">All topics are above 60% — great work!</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.weakTopics.map(t => (
                        <div key={t.label} className="rounded-xl border border-surface-border bg-surface px-4 py-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-surface-text">{t.label}</p>
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">{t.accuracy}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-border">
                            <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${t.accuracy}%` }} />
                          </div>
                          <p className="mt-1.5 text-[10px] text-surface-muted">{t.correct}/{t.total} correct · {t.sessions} attempt{t.sessions !== 1 ? 's' : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strong topics */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <h2 className="mb-4 font-display font-bold text-emerald-600 dark:text-emerald-400">🏆 Strongest Topics</h2>
                  {analytics.strongTopics.length === 0 ? (
                    <p className="text-sm text-surface-muted">Complete more quizzes to see your strengths.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.strongTopics.map((t, i) => (
                        <div key={t.label} className="rounded-xl border border-surface-border bg-surface px-4 py-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                              <p className="text-sm font-semibold text-surface-text">{t.label}</p>
                            </div>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{t.accuracy}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-border">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${t.accuracy}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SUBJECTS TAB ── */}
          {activeTab === 'subjects' && (
            <div className="space-y-4">
              {analytics.subjectBreakdown.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card text-sm text-surface-muted">
                  No subject data yet.
                </div>
              ) : (
                analytics.subjectBreakdown.map(s => (
                  <div key={s.label} className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-display font-bold text-surface-text">{s.label}</h2>
                        <p className="text-xs text-surface-muted">{s.sessions} session{s.sessions !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-6 text-center">
                        <div>
                          <p className="text-2xl font-display font-bold text-emerald-500 dark:text-emerald-400">{s.correct}</p>
                          <p className="text-[10px] text-surface-muted uppercase tracking-widest">Correct</p>
                        </div>
                        <div>
                          <p className="text-2xl font-display font-bold text-rose-500 dark:text-rose-400">{s.wrong}</p>
                          <p className="text-[10px] text-surface-muted uppercase tracking-widest">Wrong</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-display font-bold ${s.accuracy >= 70 ? 'text-emerald-500 dark:text-emerald-400' : s.accuracy >= 45 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {s.accuracy}%
                          </p>
                          <p className="text-[10px] text-surface-muted uppercase tracking-widest">Accuracy</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-surface-border">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${s.accuracy}%`,
                          background: s.accuracy >= 70 ? '#10b981' : s.accuracy >= 45 ? '#f59e0b' : '#f43f5e',
                        }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {analytics.sessionHistory.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card text-sm text-surface-muted">
                  No session history yet.
                </div>
              ) : (
                analytics.sessionHistory.map(s => (
                  <div key={s.id} className="rounded-2xl border border-surface-border bg-surface-card p-4 grid gap-3 sm:grid-cols-[1fr_auto] shadow-sm">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-1">
                        <span className="badge-primary text-[10px]">{s.subjectLabel}</span>
                        <span className="text-[10px] text-surface-muted">{s.date}</span>
                      </div>
                      <h3 className="font-semibold text-surface-text">{s.topicLabel}</h3>
                      <div className="mt-2 flex gap-4 text-xs font-medium">
                        <span className="text-surface-muted">📋 {s.totalQ} questions</span>
                        <span className="text-emerald-600 dark:text-emerald-400">✓ {s.correct} correct</span>
                        <span className="text-rose-600 dark:text-rose-400">✗ {s.wrong} wrong</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 pl-4 border-l border-surface-border">
                      <p className={`text-3xl font-display font-bold ${s.score >= 70 ? 'text-emerald-500 dark:text-emerald-400' : s.score >= 45 ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {s.score}%
                      </p>
                      <p className="text-[10px] text-surface-muted uppercase">score</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── INSIGHTS TAB ── */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-primary-500/10 to-accent-teal/10 p-6">
                <h2 className="text-xl font-display font-bold text-surface-text mb-2 flex items-center gap-2">
                  <span className="text-2xl">🤖</span> AI Study Coach
                </h2>
                <p className="text-sm text-surface-muted">
                  Your personalized, ML-driven recommendations based on your unique performance data.
                </p>
              </div>

              {loadingRecs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <span className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-sm text-surface-muted animate-pulse">Analyzing your performance matrix...</p>
                </div>
              ) : !recs || recs.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-surface-border bg-surface-card text-sm text-surface-muted">
                  Not enough data to generate recommendations yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                  {recs.map((rec, i) => (
                    <div key={i} className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rec.type === 'weakness' ? 'bg-rose-500/10 text-rose-500' :
                          rec.type === 'strength' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-primary-500/10 text-primary-500'
                        }`}>
                          {rec.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-surface-text text-lg">{rec.title}</h3>
                      <p className="text-xs text-surface-muted leading-relaxed">{rec.reason}</p>
                      <div className="mt-auto pt-3 border-t border-surface-border">
                        <p className="text-sm font-medium text-primary-500">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PredictionTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface/40 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.08em] text-surface-muted">{label}</p>
      <p className="mt-2 text-2xl font-display font-bold text-surface-text">{value}</p>
    </div>
  )
}
