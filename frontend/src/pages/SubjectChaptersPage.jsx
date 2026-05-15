import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, Search, LoaderCircle } from 'lucide-react'
import { loadCatalog, getCatalogChapter } from '@/data/catalogRegistry'
import { useLearningSelection } from '@/context/LearningSelectionContext'

export default function SubjectChaptersPage() {
  const navigate = useNavigate()
  const { classId, subjectId, chapterId } = useParams()
  const { selection } = useLearningSelection()
  const boardId = selection.boardId ?? 'state'
  
  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedChapters, setExpandedChapters] = useState([])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    
    loadCatalog(classId, subjectId, boardId).then(loadedCatalog => {
      if (!cancelled) {
        setCatalog(loadedCatalog)
        setIsLoading(false)
      }
    })
    
    return () => { cancelled = true }
  }, [classId, subjectId, boardId])

  const chapters = catalog?.chapters ?? []
  const singleChapter = useMemo(() => {
    return (catalog && chapterId) ? getCatalogChapter(catalog, chapterId) : null
  }, [catalog, chapterId])

  if (isLoading) {
    return (
      <div className="container-page flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!catalog) {
    return (
      <div className="container-page animate-fade-in text-center">
        <h1 className="text-2xl font-bold">Catalog Not Found</h1>
        <p className="mt-3 text-surface-muted">We could not load the content for {subjectId}.</p>
        <button onClick={() => navigate('/selection')} className="btn-primary mt-6">Back to Selection</button>
      </div>
    )
  }

  // If a specific chapter is selected, show its topics
  if (singleChapter) {
    return (
      <div className="container-page max-w-4xl animate-fade-in">
        <button onClick={() => navigate(`/learn/${classId}/${subjectId}`)} className="btn-ghost mb-6 pl-0">
          <ArrowLeft size={18} className="mr-1" /> All Chapters
        </button>

        <div className="mb-6">
          <div className="mb-3 flex gap-2 text-xs">
            <span className="badge-primary">{catalog.classLabel} {catalog.subject}</span>
            <span className="badge-amber">Chapter {singleChapter.number}</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-surface-text">{singleChapter.title}</h1>
          <p className="mt-2 text-sm text-surface-muted">{singleChapter.topics.length} topics</p>
        </div>

        <div className="space-y-3">
          {singleChapter.topics.map((topic, i) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}/topics/${topic.id}`)}
              className="group w-full rounded-2xl border border-surface-border bg-surface-card/70 p-5 text-left transition-all hover:border-primary-500 hover:bg-surface-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-sm font-bold text-primary-500">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-text group-hover:text-primary-500">
                      {topic.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-surface-muted">
                      <span className="rounded-full border border-surface-border bg-surface px-2 py-0.5">
                        {topic.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-surface-muted group-hover:text-primary-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Show all chapters
  const filtered = searchQuery.trim()
    ? chapters.filter(ch =>
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : chapters

  const toggleChapter = (id) => {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="container-page max-w-4xl animate-fade-in">
      <button onClick={() => navigate('/selection')} className="btn-ghost mb-6 pl-0">
        <ArrowLeft size={18} className="mr-1" /> Back to Selection
      </button>

      <div className="mb-8">
        <div className="mb-3 flex gap-2 text-xs">
          <span className="badge-primary">{catalog.board}</span>
          <span className="badge-teal">{catalog.classLabel}</span>
        </div>
        <h1 className="text-4xl font-display font-bold text-surface-text">{catalog.subject}</h1>
        <p className="mt-2 text-surface-muted">
          {chapters.length} chapters • {chapters.reduce((s, c) => s + c.topics.length, 0)} topics •
          Text-first topic descriptions with optional visual learning on demand
        </p>
      </div>

      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-muted">
          <Search size={16} />
        </div>
        <input
          type="text"
          className="input pl-10"
          placeholder="Search chapters and topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map((ch) => {
          const isExpanded = expandedChapters.includes(ch.id) || !!searchQuery.trim()
          return (
            <div key={ch.id} className="rounded-2xl border border-surface-border bg-surface-card/70 overflow-hidden">
              <button
                type="button"
                onClick={() => searchQuery.trim() ? navigate(`/learn/${classId}/${subjectId}/chapters/${ch.id}`) : toggleChapter(ch.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-surface/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-500 bg-surface-card text-lg font-bold text-primary-500">
                    {ch.number}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-text">{ch.title}</p>
                    <p className="text-xs text-surface-muted mt-1">{ch.topics.length} topics</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/learn/${classId}/${subjectId}/chapters/${ch.id}`) }}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    Open <ArrowRight size={12} />
                  </button>
                  {isExpanded ? <ChevronDown size={18} className="text-surface-muted" /> : <ChevronRight size={18} className="text-surface-muted" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-surface-border bg-surface/30 px-5 py-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ch.topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigate(`/learn/${classId}/${subjectId}/chapters/${ch.id}/topics/${t.id}`)}
                        className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-card px-3 py-2.5 text-left text-xs transition-colors hover:border-primary-500"
                      >
                        <BookOpen size={14} className="text-primary-500 shrink-0" />
                        <span className="text-surface-text">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
