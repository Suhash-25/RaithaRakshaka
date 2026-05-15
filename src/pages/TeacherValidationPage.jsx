import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircleIcon,
  ClipboardCheckIcon,
  PencilIcon,
  SparklesIcon,
  XCircleIcon,
} from '@/components/ui/Icons'
import {
  approveExplanationDraft,
  getExplanationDrafts,
  rejectExplanationDraft,
  saveExplanationDraft,
  updateExplanationDraft,
} from '@/utils/indexedDB'

const SAMPLE_DRAFTS = [
  {
    id: 'sample-physics-kinematics',
    questionId: 'sample-q1',
    questionText: 'What is velocity at the highest point of vertical motion?',
    studentAnswer: 'The object still has upward velocity.',
    subject: 'physics',
    topic: 'Kinematics',
    topicId: 'kinematics',
    misconceptionType: 'Concept misunderstanding',
    confidenceLevel: 'high',
    type: 'hybrid',
    source: 'stored_json',
    enhancedByAi: false,
    status: 'pending',
    content: 'At the highest point, velocity is momentarily zero. Gravity still acts downward, so acceleration is not zero.',
    story: 'A tossed key pauses at the top before falling back. That pause is zero velocity, not zero gravity.',
    diagram: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 150'><rect width='420' height='150' rx='14' fill='#0f172a'/><path d='M65 120C135 30 285 30 355 120' fill='none' stroke='#38bdf8' stroke-width='4'/><circle cx='210' cy='45' r='14' fill='#fbbf24'/><text x='210' y='88' fill='#e2e8f0' font-family='Inter,Arial' font-size='15' text-anchor='middle'>v = 0 at top</text></svg>",
    createdAt: Date.now() - 60_000,
    updatedAt: Date.now() - 60_000,
  },
  {
    id: 'sample-cs-variable',
    questionId: 'sample-q2',
    questionText: 'Explain the difference between variable and constant.',
    studentAnswer: 'Variable cannot change and constant changes.',
    subject: 'computer-science',
    topic: 'Programming Basics',
    topicId: 'programming-basics',
    misconceptionType: 'Concept misunderstanding',
    confidenceLevel: 'medium',
    type: 'hybrid',
    source: 'deepseek',
    enhancedByAi: true,
    status: 'pending',
    content: 'A variable is named storage whose value can change. A constant stores a value that should stay fixed.',
    story: 'A variable is like a whiteboard score you can update. A constant is like a printed rule on the wall.',
    diagram: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 150'><rect width='420' height='150' rx='14' fill='#0f172a'/><rect x='50' y='45' width='130' height='60' rx='10' fill='#1e293b' stroke='#2dd4bf' stroke-width='3'/><rect x='240' y='45' width='130' height='60' rx='10' fill='#1e293b' stroke='#fbbf24' stroke-width='3'/><text x='115' y='82' fill='#e2e8f0' font-family='Inter,Arial' font-size='15' text-anchor='middle'>variable</text><text x='305' y='82' fill='#e2e8f0' font-family='Inter,Arial' font-size='15' text-anchor='middle'>constant</text></svg>",
    createdAt: Date.now() - 30_000,
    updatedAt: Date.now() - 30_000,
  },
]

function statusClass(status) {
  if (status === 'approved') return 'badge-teal'
  if (status === 'rejected') return 'badge-rose'
  return 'badge-amber'
}

export default function TeacherValidationPage() {
  const [drafts, setDrafts] = useState([])
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadDrafts()
  }, [])

  async function loadDrafts() {
    let rows = await getExplanationDrafts()
    if (rows.length === 0) {
      await Promise.all(SAMPLE_DRAFTS.map((draft) => saveExplanationDraft(draft)))
      rows = await getExplanationDrafts()
    }
    setDrafts(rows.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)))
  }

  const visibleDrafts = useMemo(() => {
    if (filter === 'all') return drafts
    return drafts.filter((draft) => draft.status === filter)
  }, [drafts, filter])

  const counts = useMemo(() => ({
    all: drafts.length,
    pending: drafts.filter((draft) => draft.status === 'pending').length,
    approved: drafts.filter((draft) => draft.status === 'approved').length,
    rejected: drafts.filter((draft) => draft.status === 'rejected').length,
  }), [drafts])

  async function handleApprove(draft) {
    await approveExplanationDraft({ ...draft, status: 'approved' })
    setEditing(null)
    await loadDrafts()
  }

  async function handleReject(draft) {
    await rejectExplanationDraft(draft)
    setEditing(null)
    await loadDrafts()
  }

  async function handleSave(event) {
    event.preventDefault()
    await updateExplanationDraft(editing)
    setEditing(null)
    await loadDrafts()
  }

  return (
    <div className="container-page animate-fade-in">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 badge-primary">
            <ClipboardCheckIcon className="h-3.5 w-3.5" />
            Teacher review
          </div>
          <h1 className="text-4xl font-display font-bold text-surface-text">
            Validate explanations
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {['all', 'pending', 'approved', 'rejected'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all
                          ${filter === item
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
                          }`}
            >
              <span className="block text-base text-surface-text">{counts[item]}</span>
              {item}
            </button>
          ))}
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-surface-border bg-surface/60 text-xs uppercase tracking-wide text-surface-muted">
              <tr>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Misconception</th>
                <th className="px-4 py-3">Explanation</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visibleDrafts.map((draft) => (
                <tr key={draft.id} className="align-top hover:bg-white/[0.03]">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-surface-text">{draft.topic}</p>
                    <p className="text-xs text-surface-muted">{draft.subject}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-surface-text">{draft.misconceptionType}</p>
                    <p className="text-xs text-surface-muted">{draft.confidenceLevel}</p>
                  </td>
                  <td className="max-w-md px-4 py-4">
                    <p className="line-clamp-2 text-surface-muted">{draft.content}</p>
                    <p className="mt-2 line-clamp-1 text-xs text-accent-amber">{draft.story}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span className="badge-primary w-fit">{draft.source ?? 'local'}</span>
                      {draft.enhancedByAi && <span className="badge-amber w-fit">AI</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={statusClass(draft.status)}>{draft.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(draft)}
                        className="btn-secondary px-3 py-2"
                        aria-label={`Edit ${draft.topic}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(draft)}
                        className="btn-secondary px-3 py-2 text-accent-teal"
                        aria-label={`Approve ${draft.topic}`}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(draft)}
                        className="btn-secondary px-3 py-2 text-accent-rose"
                        aria-label={`Reject ${draft.topic}`}
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleDrafts.length === 0 && (
          <div className="p-10 text-center text-surface-muted">
            No explanations in this review state.
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-primary-500">
                  <SparklesIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">Edit explanation</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-surface-text">{editing.topic}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost px-3 py-2">
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-surface-text">Topic</span>
                <input
                  className="input"
                  value={editing.topic}
                  onChange={(event) => setEditing({ ...editing, topic: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-surface-text">Type</span>
                <select
                  className="input"
                  value={editing.type}
                  onChange={(event) => setEditing({ ...editing, type: event.target.value })}
                >
                  <option value="visual">visual</option>
                  <option value="story">story</option>
                  <option value="hybrid">hybrid</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-surface-text">Simplified explanation</span>
              <textarea
                className="input min-h-32 resize-y"
                value={editing.content}
                onChange={(event) => setEditing({ ...editing, content: event.target.value })}
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-surface-text">Story analogy</span>
              <textarea
                className="input min-h-28 resize-y"
                value={editing.story}
                onChange={(event) => setEditing({ ...editing, story: event.target.value })}
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-surface-text">Diagram SVG or path</span>
              <textarea
                className="input min-h-28 resize-y font-mono text-xs"
                value={editing.diagram}
                onChange={(event) => setEditing({ ...editing, diagram: event.target.value })}
              />
            </label>

            {editing.diagram?.trim().startsWith('<svg') && (
              <div
                className="mt-4 overflow-hidden rounded-2xl border border-surface-border bg-surface/40 [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: editing.diagram }}
                aria-label="Diagram preview"
              />
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => handleReject(editing)} className="btn-danger">
                <XCircleIcon className="h-4 w-4" />
                Reject
              </button>
              <button type="button" onClick={() => handleApprove(editing)} className="btn-secondary text-accent-teal">
                <CheckCircleIcon className="h-4 w-4" />
                Approve
              </button>
              <button type="submit" className="btn-primary">
                <PencilIcon className="h-4 w-4" />
                Save edits
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
