import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BookOpen, BrainCircuit, CheckCircle2,
  ChevronRight, ExternalLink, Eye, Lightbulb, Play, XCircle, LoaderCircle
} from 'lucide-react'
import PhysicsAnimationEngine from '@/components/physics/PhysicsAnimationEngine'
import { getAnimation } from '@/components/physics/animations'
import { loadCatalog, getCatalogChapter, getCatalogTopic } from '@/data/catalogRegistry'
import { buildTopicDescription, buildVisualSearchUrl, buildVisualVideoUrl } from '@/data/syllabusBoards'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import { useStudent } from '@/context/StudentContext'
import { saveMisconceptionResult } from '@/utils/misconceptionTracker'
import { saveProgressEvent } from '@/utils/indexedDB'

const STAGE_LABELS = ['Description', 'Questions', 'Analysis']

export default function SubjectLearningPage() {
  const navigate = useNavigate()
  const { currentStudent } = useStudent()
  const { classId, subjectId, chapterId, topicId } = useParams()
  const { selection } = useLearningSelection()
  const boardId = selection.boardId ?? 'state'

  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [learningStage, setLearningStage] = useState(0) // 0=description, 1=questions, 2=misconceptions
  const [showVisual, setShowVisual] = useState(false)
  const [showVisualVideo, setShowVisualVideo] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showHints, setShowHints] = useState({})
  const [misconceptionAnswers, setMisconceptionAnswers] = useState({})
  const [misconceptionSubmitted, setMisconceptionSubmitted] = useState(false)

  const [enrichedData, setEnrichedData] = useState(null)
  const [isEnriching, setIsEnriching] = useState(false)

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

  const chapter = useMemo(() => {
    return (catalog && chapterId) ? getCatalogChapter(catalog, chapterId) : null
  }, [catalog, chapterId])

  const topic = useMemo(() => {
    return (catalog && chapterId && topicId) ? getCatalogTopic(catalog, chapterId, topicId) : null
  }, [catalog, chapterId, topicId])

  useEffect(() => {
    if (!topic || !chapter || !catalog) return
    setEnrichedData(null)
    
    // Check if we already have questions or a very long description
    if (topic.questions?.length > 0) return

    setIsEnriching(true)
    fetch('/api/student/enrich-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board: catalog.board ?? 'State Board',
        classLabel: catalog.classLabel ?? classId,
        subject: catalog.subject ?? subjectId,
        chapterTitle: chapter.title ?? chapterId,
        topicTitle: topic.title ?? topicId,
      })
    })
    .then(r => r.json())
    .then(data => {
      setEnrichedData(data)
      setIsEnriching(false)
    })
    .catch(e => {
      console.error("Enrichment failed", e)
      setIsEnriching(false)
    })
  }, [topicId, catalog, chapter, topic, classId, subjectId])

  const animation = useMemo(() => topic?.animationType ? getAnimation(topic.animationType) : null, [topic])
  const questions = enrichedData?.questions?.length > 0 ? enrichedData.questions : (topic?.questions ?? [])
  const misconceptions = enrichedData?.misconceptions?.length > 0 ? enrichedData.misconceptions : (topic?.misconceptions ?? [])
  const topicDescription = useMemo(() => {
    if (!topic || !chapter || !catalog) return ''
    return enrichedData?.description || topic.description || buildTopicDescription({
      boardLabel: catalog.board ?? 'Syllabus',
      classLabel: catalog.classLabel,
      subjectName: catalog.subject,
      chapterTitle: chapter.title,
      topicName: topic.title,
    })
  }, [catalog, chapter, topic, enrichedData])
  const visualQuery = `${catalog?.classLabel ?? classId} ${catalog?.subject ?? subjectId} ${chapter?.title ?? ''} ${topic?.title ?? ''} explanation`
  const visualVideoUrl = topic?.visualVideoUrl || buildVisualVideoUrl(visualQuery)
  const visualSearchUrl = topic?.visualSearchUrl || buildVisualSearchUrl(visualQuery)

  useEffect(() => {
    setLearningStage(1)
    setShowVisual(false)
    setShowVisualVideo(false)
  }, [topicId])

  // Find next/prev topic for navigation
  const topicNav = useMemo(() => {
    if (!chapter || !topic) return { prev: null, next: null }
    const idx = chapter.topics.findIndex(t => t.id === topicId)
    return {
      prev: idx > 0 ? chapter.topics[idx - 1] : null,
      next: idx < chapter.topics.length - 1 ? chapter.topics[idx + 1] : null,
    }
  }, [chapter, topic, topicId])

  const handleAnswerChange = useCallback((qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }))
  }, [])

  const handleMisconceptionSelect = useCallback((mId, optionIndex) => {
    if (misconceptionSubmitted) return
    setMisconceptionAnswers(prev => ({ ...prev, [mId]: optionIndex }))
  }, [misconceptionSubmitted])

  const handleSubmitMisconceptions = useCallback(async () => {
    setMisconceptionSubmitted(true)
    const results = []
    for (const m of misconceptions) {
      const selected = misconceptionAnswers[m.id]
      if (selected !== undefined) {
        const isCorrect = selected === m.correctIndex
        results.push({
          questionId: m.id,
          probe: m.probe,
          selectedIndex: selected,
          correctIndex: m.correctIndex,
          isCorrect,
        })
        await saveMisconceptionResult({
          chapterId, topicId, misconceptionId: m.id,
          probe: m.probe, selectedIndex: selected,
          correctIndex: m.correctIndex,
          isCorrect,
        }).catch(() => {})
      }
    }

    const correctCount = results.filter(r => r.isCorrect).length
    const totalCount = results.length
    const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    await saveProgressEvent({
      student_id: currentStudent?.id || 'guest',
      topicId,
      topicLabel: topic?.title ?? topicId,
      subjectId,
      subjectLabel: catalog?.subject ?? subjectId,
      chapterId,
      chapterLabel: chapter?.title ?? chapterId,
      classId,
      classLabel: catalog?.classLabel ?? classId,
      totalQuestions: totalCount,
      correctAnswers: correctCount,
      wrongAnswers: totalCount - correctCount,
      scorePct,
      masteryScore: scorePct,
      questionResults: results,
      misconceptionType: correctCount === totalCount ? 'No misconception' : 'Misconception detected',
      confidenceLevel: scorePct >= 80 ? 'high' : scorePct >= 50 ? 'medium' : 'low',
      createdAt: Date.now(),
    }).catch(console.error)

  }, [misconceptionAnswers, misconceptions, chapterId, topicId, topic, catalog, chapter, classId, subjectId, currentStudent])

  const checkAnswer = useCallback((question, answerText) => {
    if (!answerText?.trim()) return { score: 0, matched: [], missing: question.expectedConcepts }
    const lower = answerText.toLowerCase()
    const expected = question.expectedConcepts || []
    if (expected.length === 0) return { score: 1, matched: [], missing: [] }
    const matched = expected.filter(c => lower.includes(c.toLowerCase()))
    const missing = expected.filter(c => !lower.includes(c.toLowerCase()))
    return { score: matched.length / expected.length, matched, missing }
  }, [])

  if (isLoading || isEnriching) {
    return (
      <div className="container-page flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary-500/20"></div>
          <LoaderCircle className="h-10 w-10 animate-spin text-primary-500 relative z-10" />
        </div>
        <h2 className="text-xl font-bold font-display text-surface-text">
          {isEnriching ? "AI Teacher is analyzing..." : "Loading content..."}
        </h2>
        <p className="mt-2 text-surface-muted text-sm max-w-sm text-center">
          {isEnriching 
            ? "Creating a custom-tailored, detailed explanation and generating unique practice questions specifically for this topic. Please wait a few seconds."
            : "Fetching your learning materials."}
        </p>
      </div>
    )
  }

  if (!chapter || !topic) {
    return (
      <div className="container-page animate-fade-in">
        <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-surface-text">Topic not found</h1>
          <p className="mt-3 text-surface-muted">The requested chapter or topic does not exist.</p>
          <button type="button" onClick={() => navigate(`/learn/${classId}/${subjectId}`)} className="btn-primary mt-6">
            Back to Chapters
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page max-w-5xl animate-fade-in">
      <button onClick={() => navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}`)} className="btn-ghost mb-4 pl-0">
        <ArrowLeft size={18} className="mr-1" /> Back to {chapter.title}
      </button>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="badge-primary">{catalog.classLabel} {catalog.subject}</span>
          <span className="badge-amber">Ch {chapter.number}</span>
          <span className="badge-teal">{topic.duration}</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-surface-text">{topic.title}</h1>
        <p className="mt-2 text-sm text-surface-muted">
          Chapter {chapter.number}: {chapter.title}
        </p>
        {topic.description && (
          <div className="mt-4 rounded-xl border border-surface-border bg-surface/40 p-4">
            <p className="text-sm leading-relaxed text-surface-text">
              {topic.description}
            </p>
          </div>
        )}
      </div>

      <section className="mb-6 rounded-2xl border border-surface-border bg-surface-card/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex rounded-full border border-surface-border bg-surface px-2.5 py-1 text-xs font-semibold text-surface-muted">
              Text explanation first
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-surface-muted">
              {topicDescription.split('\n\n').map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {topic.keyPoints?.length > 0 && (
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {topic.keyPoints.slice(0, 3).map((point) => (
                  <div key={point} className="rounded-xl border border-surface-border bg-surface/60 px-3 py-2 text-xs leading-relaxed text-surface-muted">
                    {point}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowVisualVideo((value) => !value)}
            className="btn-secondary shrink-0"
          >
            <Play size={16} />
            {showVisualVideo ? 'Hide visual video' : 'Visual video'}
          </button>
        </div>

        {showVisualVideo && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-surface-border bg-surface">
            <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
              <p className="text-sm font-semibold text-surface-text">Visual understanding</p>
              <a href={visualSearchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:underline">
                Open videos
                <ExternalLink size={13} />
              </a>
            </div>
            <div className="aspect-video w-full bg-surface-card">
              <iframe
                title={`${topic.title} visual explanation`}
                src={visualVideoUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </section>

      <div className="mb-6 flex gap-2">
        {STAGE_LABELS.map((label, i) => {
          return (
            <button
              key={label}
              type="button"
              onClick={() => setLearningStage(i)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                learningStage === i
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
              }`}
            >
              {i === 0 && <Eye size={16} />}
              {i === 1 && <BookOpen size={16} />}
              {i === 2 && <BrainCircuit size={16} />}
              {label}
              {i < learningStage && <CheckCircle2 size={14} className="text-accent-emerald" />}
            </button>
          )
        })}
      </div>

      {/* Stage 0: Description-first learning */}
      {learningStage === 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-surface-text">Read the idea first</h2>
                <p className="mt-2 text-sm leading-relaxed text-surface-muted">
                  {topic.description ?? `${topic.title} is part of ${chapter.title}. Start with the explanation, then open the visual only if you want another way to understand it.`}
                </p>
              </div>
              {animation && (
                <button
                  type="button"
                  onClick={() => setShowVisual((current) => !current)}
                  className="btn-secondary shrink-0"
                >
                  <Play size={16} />
                  {showVisual ? 'Hide visual' : 'Show visual'}
                </button>
              )}
            </div>

            {topic.learningObjectives?.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {topic.learningObjectives.map((objective) => (
                  <div key={objective} className="rounded-xl border border-surface-border bg-surface/50 px-4 py-3 text-sm text-surface-text">
                    {objective}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showVisual && animation && (
            <PhysicsAnimationEngine
              animation={animation}
              title={`${topic.title} - Visual Understanding`}
            />
          )}
          <div className="flex justify-end">
            <button type="button" onClick={() => setLearningStage(1)} className="btn-primary">
              Continue to questions <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stage 1: Questions */}
      {learningStage === 1 && (
        <div className="space-y-6 animate-fade-in">
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6 text-center text-surface-muted">
              No questions available for this topic yet.
              <div className="mt-4">
                <button type="button" onClick={() => setLearningStage(2)} className="btn-primary mx-auto">
                  Continue to misconception check <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQ(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                      currentQ === i
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : answers[q.id]
                        ? 'border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald'
                        : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {questions[currentQ] && (
                <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="badge-primary">Q{currentQ + 1}</span>
                    <span className="text-xs text-surface-muted">{questions[currentQ].estimatedTime}</span>
                  </div>

                  <h2 className="mb-6 text-xl font-display font-bold leading-relaxed text-surface-text">
                    {questions[currentQ].text}
                  </h2>

                  <textarea
                    value={answers[questions[currentQ].id] ?? ''}
                    onChange={(e) => handleAnswerChange(questions[currentQ].id, e.target.value)}
                    rows={5}
                    className="input min-h-32 resize-none text-base"
                    placeholder="Type your answer here..."
                  />

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowHints(prev => ({ ...prev, [questions[currentQ].id]: !prev[questions[currentQ].id] }))}
                      className="flex items-center gap-1.5 text-sm font-medium text-accent-amber hover:underline"
                    >
                      <Lightbulb size={16} />
                      {showHints[questions[currentQ].id] ? 'Hide hint' : 'Show hint'}
                    </button>
                    {showHints[questions[currentQ].id] && (
                      <div className="mt-2 rounded-xl border border-accent-amber/20 bg-accent-amber/5 px-4 py-3 text-sm text-accent-amber/90 animate-slide-up">
                        {questions[currentQ].hint}
                      </div>
                    )}
                  </div>

                  {answers[questions[currentQ].id]?.trim() && questions[currentQ].expectedConcepts?.length > 0 && (
                    <div className="mt-4 rounded-xl border border-surface-border bg-surface/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-surface-muted mb-2">Concept Coverage</p>
                      {(() => {
                        const result = checkAnswer(questions[currentQ], answers[questions[currentQ].id])
                        return (
                          <div>
                            <div className="progress-track h-2 mb-3">
                              <div
                                className="progress-fill"
                                style={{ width: `${result.score * 100}%`, backgroundColor: result.score >= 0.7 ? '#22c55e' : result.score >= 0.4 ? '#eab308' : '#ef4444' }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {result.matched.map(c => (
                                <span key={c} className="rounded-full bg-accent-emerald/10 border border-accent-emerald/20 px-2 py-0.5 text-xs text-accent-emerald">
                                  ✓ {c}
                                </span>
                              ))}
                              {result.missing.map(c => (
                                <span key={c} className="rounded-full bg-surface border border-surface-border px-2 py-0.5 text-xs text-surface-muted">
                                  ○ {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={currentQ === 0}
                      onClick={() => setCurrentQ(i => i - 1)}
                      className="btn-secondary"
                    >
                      Previous
                    </button>
                    {currentQ < questions.length - 1 ? (
                      <button type="button" onClick={() => setCurrentQ(i => i + 1)} className="btn-primary">
                        Next question <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button type="button" onClick={() => setLearningStage(2)} className="btn-primary">
                        Continue to misconception check <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Stage 2: Misconception Detection */}
      {learningStage === 2 && (
        <div className="space-y-6 animate-fade-in">
          {misconceptions.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6 text-center text-surface-muted">
              No misconception probes available for this topic yet.
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                  {topicNav.prev && (
                    <button
                      type="button"
                      onClick={() => {
                        setLearningStage(1); setCurrentQ(0); setAnswers({}); setShowHints({})
                        setMisconceptionAnswers({}); setMisconceptionSubmitted(false)
                        navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}/topics/${topicNav.prev.id}`)
                      }}
                      className="btn-secondary"
                    >
                      <ArrowLeft size={16} /> Previous: {topicNav.prev.title}
                    </button>
                  )}
                  {topicNav.next && (
                    <button
                      type="button"
                      onClick={() => {
                        setLearningStage(1); setCurrentQ(0); setAnswers({}); setShowHints({})
                        setMisconceptionAnswers({}); setMisconceptionSubmitted(false)
                        navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}/topics/${topicNav.next.id}`)
                      }}
                      className="btn-primary"
                    >
                      Next: {topicNav.next.title} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
              <div className="mb-6 flex items-center gap-3">
                <BrainCircuit size={24} className="text-primary-500" />
                <div>
                  <h2 className="text-xl font-display font-bold text-surface-text">Analysis</h2>
                  <p className="text-sm text-surface-muted">These probes test for common misunderstandings. Choose carefully!</p>
                </div>
              </div>

              <div className="space-y-6">
                {misconceptions.map((m, i) => {
                  const selected = misconceptionAnswers[m.id]
                  const submitted = misconceptionSubmitted
                  const isCorrect = selected === m.correctIndex

                  return (
                    <div key={m.id} className="rounded-xl border border-surface-border bg-surface/50 p-5">
                      <p className="mb-4 text-sm font-semibold text-surface-text">
                        {i + 1}. {m.probe}
                      </p>
                      <div className="space-y-2">
                        {m.options.map((opt, oi) => {
                          let optClass = 'border-surface-border bg-surface-card text-surface-muted hover:border-primary-500 hover:text-surface-text'
                          if (selected === oi && !submitted) {
                            optClass = 'border-primary-500 bg-primary-500 text-white'
                          }
                          if (submitted && oi === m.correctIndex) {
                            optClass = 'border-accent-emerald/50 bg-accent-emerald/10 text-accent-emerald'
                          }
                          if (submitted && selected === oi && oi !== m.correctIndex) {
                            optClass = 'border-accent-rose/50 bg-accent-rose/10 text-accent-rose'
                          }

                          return (
                            <button
                              key={oi}
                              type="button"
                              onClick={() => handleMisconceptionSelect(m.id, oi)}
                              disabled={submitted}
                              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${optClass}`}
                            >
                              <span className="mr-2 font-mono text-xs">{oi === 0 ? 'A' : 'B'}</span>
                              {opt}
                              {submitted && oi === m.correctIndex && <CheckCircle2 size={16} className="inline ml-2 text-accent-emerald" />}
                              {submitted && selected === oi && oi !== m.correctIndex && <XCircle size={16} className="inline ml-2 text-accent-rose" />}
                            </button>
                          )
                        })}
                      </div>
                      {submitted && (
                        <div className={`mt-3 rounded-lg p-3 text-sm ${isCorrect ? 'bg-accent-emerald/5 border border-accent-emerald/20 text-accent-emerald' : 'bg-accent-rose/5 border border-accent-rose/20 text-accent-rose/90'}`}>
                          {isCorrect ? '✓ Correct! ' : '✗ Misconception detected: '}
                          {m.correction}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {!misconceptionSubmitted ? (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitMisconceptions}
                    disabled={Object.keys(misconceptionAnswers).length < misconceptions.length}
                    className="btn-primary"
                  >
                    Check my understanding
                  </button>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="rounded-xl border border-surface-border bg-surface/50 p-4 mb-4">
                    <p className="text-sm font-semibold text-surface-text mb-2">Results Summary</p>
                    {(() => {
                      const correct = misconceptions.filter(m => misconceptionAnswers[m.id] === m.correctIndex).length
                      const total = misconceptions.length
                      const pct = Math.round((correct / total) * 100)
                      const color = pct >= 80 ? 'text-accent-emerald' : pct >= 50 ? 'text-accent-amber' : 'text-accent-rose'
                      return (
                        <p className={`text-2xl font-display font-bold ${color}`}>
                          {correct}/{total} correct ({pct}%)
                        </p>
                      )
                    })()}
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {topicNav.prev && (
                      <button
                        type="button"
                        onClick={() => {
                          setLearningStage(1); setCurrentQ(0); setAnswers({}); setShowHints({})
                          setMisconceptionAnswers({}); setMisconceptionSubmitted(false)
                          navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}/topics/${topicNav.prev.id}`)
                        }}
                        className="btn-secondary"
                      >
                        <ArrowLeft size={16} /> Previous: {topicNav.prev.title}
                      </button>
                    )}
                    {topicNav.next && (
                      <button
                        type="button"
                        onClick={() => {
                          setLearningStage(1); setCurrentQ(0); setAnswers({}); setShowHints({})
                          setMisconceptionAnswers({}); setMisconceptionSubmitted(false)
                          navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}/topics/${topicNav.next.id}`)
                        }}
                        className="btn-primary"
                      >
                        Next: {topicNav.next.title} <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
