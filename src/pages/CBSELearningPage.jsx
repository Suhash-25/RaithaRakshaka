import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, ArrowRight, BookOpen, ChevronRight, Play, LoaderCircle, 
  Layers3, CheckCircle2, BrainCircuit, Eye, Lightbulb, XCircle 
} from 'lucide-react'
import SmartNotebook from '../components/ui/SmartNotebook'

// ─── CBSE Subject meta ────────────────────────────────────────────────────────
const SUBJECT_META = {
  mathematics:     { color: 'from-blue-600 to-cyan-500',    bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  label: 'Mathematics' },
  science:         { color: 'from-green-600 to-emerald-400',bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Science' },
  english:         { color: 'from-violet-600 to-purple-400',bg: 'bg-violet-500/10',border: 'border-violet-500/30',label: 'English' },
  hindi:           { color: 'from-orange-600 to-amber-400', bg: 'bg-orange-500/10',border: 'border-orange-500/30',label: 'Hindi' },
  'social-science':{ color: 'from-yellow-600 to-amber-400', bg: 'bg-yellow-500/10',border: 'border-yellow-500/30',label: 'Social Science' },
  'computer-science':{ color: 'from-indigo-600 to-blue-400',bg: 'bg-indigo-500/10',border: 'border-indigo-500/30',label: 'Computer Science' },
  physics:         { color: 'from-sky-600 to-cyan-400',     bg: 'bg-sky-500/10',   border: 'border-sky-500/30',   label: 'Physics' },
  chemistry:       { color: 'from-lime-600 to-green-400',   bg: 'bg-lime-500/10',  border: 'border-lime-500/30',  label: 'Chemistry' },
  biology:         { color: 'from-teal-600 to-emerald-400', bg: 'bg-teal-500/10',  border: 'border-teal-500/30',  label: 'Biology' },
}
const defaultMeta = { color: 'from-primary-600 to-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/30', label: 'Subject' }

// ─── Load CBSE knowledge.json ─────────────────────────────────────────────────
async function loadCBSECatalog(classId) {
  const norm = classId.replace(/^class-?0*/, 'class-')
  const url = `/syllabus_data/cbse/${norm}/knowledge.json`
  let res
  try { res = await fetch(url) } catch { throw new Error('NETWORK_ERROR') }
  if (!res.ok) throw new Error('NOT_FOUND')
  const text = await res.text()
  if (text.trimStart().startsWith('<')) throw new Error('NOT_FOUND') // got HTML 404
  return JSON.parse(text)
}

// ─── Load CBSE knowledge_enhanced.json ─────────────────────────────────────────
async function loadCBSEEnhancedData(classId, subjectSlug, topicId) {
  try {
    const normClass = classId.replace(/^class-?0*/, 'class-')
    const url = `/syllabus_data/cbse/${normClass}/${subjectSlug}/knowledge_enhanced.json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data[topicId] || null
  } catch (e) {
    console.warn('[CBSE] Failed to load enhanced data:', e)
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function classLabel(classId) {
  const n = classId.replace(/[^0-9]/g, '')
  const suffixes = { 1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI',12:'XII' }
  return `Class ${suffixes[parseInt(n)] ?? n}`
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function CBSELearningPage() {
  const { classId, subjectId, chapterId, topicId } = useParams()
  const navigate = useNavigate()

  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    loadCBSECatalog(classId)
      .then(data => { setCatalog(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [classId])

  if (loading) return <LoadingScreen />
  if (error === 'NOT_FOUND') return <ComingSoonScreen classId={classId} />
  if (error)   return <ErrorScreen message="Could not connect. Check your network and try again." classId={classId} />

  // Route decision
  if (!subjectId) return <SubjectsView catalog={catalog} classId={classId} navigate={navigate} />
  if (!chapterId)  return <ChaptersView catalog={catalog} classId={classId} subjectId={subjectId} navigate={navigate} />
  if (!topicId)    return <ChaptersView catalog={catalog} classId={classId} subjectId={subjectId} chapterId={chapterId} navigate={navigate} />
  return <TopicView catalog={catalog} classId={classId} subjectId={subjectId} chapterId={chapterId} topicId={topicId} navigate={navigate} />
}

// ─── Subjects view ────────────────────────────────────────────────────────────
function SubjectsView({ catalog, classId, navigate }) {
  const label = classLabel(classId)
  return (
    <div className="container-page max-w-5xl animate-fade-in">
      <div className="mb-6 flex flex-wrap gap-3">
        <button 
          onClick={() => navigate('/selection')} 
          className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card/50 px-4 py-2 text-sm font-semibold text-surface-text transition-all hover:bg-surface-border"
        >
          <ArrowLeft size={18} /> Back to Board Selection
        </button>
        <button 
          onClick={() => navigate('/selection')} 
          className="flex items-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-sm font-semibold text-primary-400 transition-all hover:bg-primary-500/20"
        >
          <Layers3 size={18} /> Change Class
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2 text-sm text-surface-muted">
        <span className="rounded-full bg-primary-500/20 px-3 py-1 text-xs font-bold text-primary-500 uppercase tracking-widest">CBSE</span>
        <ChevronRight size={14} />
        <span>{label}</span>
      </div>
      <h1 className="mb-1 text-3xl font-display font-bold text-surface-text">{label} — Subjects</h1>
      <p className="mb-8 text-surface-muted">Select a subject to explore CBSE chapters and topics.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.subjects.map(sub => {
          const meta = SUBJECT_META[sub.slug] ?? defaultMeta
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => navigate(`/learn/cbse/${classId}/${sub.slug}`)}
              className={`group rounded-2xl border ${meta.border} ${meta.bg} p-6 text-left transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className={`mb-3 inline-block rounded-xl bg-gradient-to-br ${meta.color} px-3 py-1 text-xs font-bold text-white uppercase tracking-wider`}>
                CBSE
              </div>
              <h2 className="text-xl font-display font-bold text-surface-text group-hover:text-primary-400 transition-colors">
                {sub.label}
              </h2>
              <p className="mt-1 text-sm text-surface-muted">{sub.chapters.length} chapters</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary-400">
                Explore <ArrowRight size={14} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chapters view ────────────────────────────────────────────────────────────
function ChaptersView({ catalog, classId, subjectId, navigate }) {
  const subject = catalog.subjects.find(s => s.slug === subjectId || s.id === subjectId)
  const meta    = SUBJECT_META[subjectId] ?? defaultMeta
  if (!subject) return <ErrorScreen message={`Subject "${subjectId}" not found`} classId={classId} />

  return (
    <div className="container-page max-w-5xl animate-fade-in">
      <button onClick={() => navigate(`/learn/cbse/${classId}/subjects`)} className="btn-ghost mb-4 pl-0">
        <ArrowLeft size={18} className="mr-1" /> Back to {classLabel(classId)}
      </button>

      <div className="mb-2 flex items-center gap-2 text-sm text-surface-muted">
        <span className="rounded-full bg-primary-500/20 px-3 py-1 text-xs font-bold text-primary-500 uppercase tracking-widest">CBSE</span>
        <ChevronRight size={14} /><span>{classLabel(classId)}</span>
        <ChevronRight size={14} /><span>{subject.label}</span>
      </div>

      <h1 className="mb-1 text-3xl font-display font-bold text-surface-text">{subject.label}</h1>
      <p className="mb-8 text-surface-muted">CBSE {classLabel(classId)} — {subject.chapters.length} chapters</p>

      <div className="space-y-4">
        {subject.chapters.map(ch => (
          <div key={ch.id} className={`rounded-2xl border ${meta.border} ${meta.bg} p-5`}>
            <h2 className="mb-3 text-lg font-semibold text-surface-text">
              Ch {ch.number}: {ch.title}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {ch.topics.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/learn/cbse/${classId}/${subjectId}/chapters/${ch.id}/topics/${t.id}`)}
                  className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-card/60 p-3 text-left text-sm transition-all hover:border-primary-500 hover:bg-primary-500/5 group"
                >
                  <BookOpen size={15} className="shrink-0 text-surface-muted group-hover:text-primary-400" />
                  <span className="flex-1 text-surface-text group-hover:text-primary-400 font-medium">{t.title}</span>
                  <span className="shrink-0 text-xs text-surface-muted">{t.duration} min</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { getGenZVideoPath } from '../utils/genzVideoResolver'
import { loadGlobalCatalog, findTopicInGlobalCatalog } from '../utils/globalCatalogLoader'

// ─── Topic view (Smart Notebook with stages) ───────────────────────────────────────
function TopicView({ catalog, classId, subjectId, chapterId, topicId, navigate }) {
  const subject = catalog.subjects.find(s => s.slug === subjectId || s.id === subjectId)
  const chapter = subject?.chapters.find(c => c.id === chapterId)
  const topic   = chapter?.topics.find(t => t.id === topicId)
  
  const [topicData, setTopicData] = useState(null)
  const [extraData, setExtraData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Learning stages like SubjectLearningPage
  const [learningStage, setLearningStage] = useState(0) // 0=Notebook, 1=Questions, 2=Misconceptions
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showHints, setShowHints] = useState({})
  const [misconceptionAnswers, setMisconceptionAnswers] = useState({})
  const [misconceptionSubmitted, setMisconceptionSubmitted] = useState(false)

  useEffect(() => {
    setLoading(true)
    
    // Load enhanced description
    loadCBSEEnhancedData(classId, subjectId, topicId)
      .then(data => {
        setTopicData(data)
        setLoading(false)
      })

    // Load extra pedagogical data (questions/misconceptions) from global catalog
    loadGlobalCatalog().then(gCat => {
      const found = findTopicInGlobalCatalog(gCat, classId, subjectId, topic?.title || topicId)
      if (found) {
        setExtraData(found)
      }
    })

    // Reset state on topic change
    setLearningStage(0); setCurrentQ(0); setAnswers({}); setShowHints({})
    setMisconceptionAnswers({}); setMisconceptionSubmitted(false)
  }, [classId, subjectId, topicId, topic?.title])

  const videoUrl = useMemo(() => {
    return getGenZVideoPath({
      subject: subject?.label || subjectId,
      chapterNumber: chapter?.number || 1,
      topicTitle: topic?.title || topicId,
      topicId,
      board: 'cbse',
      classId
    })
  }, [subject, chapter, topic, subjectId, topicId, classId])

  if (!topic) return <ErrorScreen message="Topic not found" classId={classId} />

  const allTopics = chapter?.topics ?? []
  const idx = allTopics.findIndex(t => t.id === topicId)
  const prev = allTopics[idx - 1] ?? null
  const next = allTopics[idx + 1] ?? null

  // Use questions/misconceptions from topic or extraData
  const questions = topic.questions || extraData?.questions || []
  const misconceptions = topic.misconceptions || extraData?.misconceptions || []

  const generateFallback = () => {
    return {
      description: `${topic.title} is a fundamental concept in the CBSE ${classLabel(classId)} ${subject?.label} curriculum, specifically designed to build a strong conceptual foundation according to NCERT standards. Understanding this topic is crucial for mastering the advanced principles that follow in subsequent chapters, as it provides the basic framework for theoretical analysis and practical application.\n\nHistorically, the development of ${topic.title} has played a significant role in scientific and mathematical advancement, allowing students to visualize complex relationships through structured logic and empirical evidence. In this module, we explore the core characteristics, standard definitions, and the governing rules that define this area of study, ensuring a comprehensive grasp of the underlying mechanics.\n\nFrom a practical perspective, ${topic.title} finds extensive application in modern technology, daily life, and industrial processes. By studying these principles, students develop analytical thinking skills that are essential for problem-solving in real-world scenarios. This module emphasizes the connection between classroom theory and observable phenomena, bridging the gap between abstract concepts and tangible results.\n\nFurthermore, mastery of ${topic.title} is a key requirement for success in CBSE board examinations and competitive entrance tests. The following sections provide a detailed breakdown of essential key points, critical formulas, and memory mnemonics designed to streamline the revision process and ensure long-term retention of the material.`,
      key_points: [
        `Core theoretical framework of ${topic.title}`,
        'NCERT aligned conceptual analysis and definitions',
        'Step-by-step breakdown of fundamental properties',
        'Relationship between theoretical variables and constants',
        'Practical real-world applications and use cases'
      ],
      summary: `In summary, ${topic.title} represents a cornerstone of the ${subject?.label} syllabus for CBSE ${classLabel(classId)}. It encompasses the essential theories, practical applications, and analytical methods required for a complete understanding of the subject. Regular practice and visualization of these concepts are recommended for academic excellence.`,
      remember_this: `Strategic focus on ${topic.title} ensures a strong performance in CBSE board evaluations.`
    }
  }

  const effectiveData = topicData || generateFallback()

  const handleAnswerChange = useCallback((qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }))
  }, [])

  const handleMisconceptionSelect = useCallback((mId, optionIndex) => {
    if (misconceptionSubmitted) return
    setMisconceptionAnswers(prev => ({ ...prev, [mId]: optionIndex }))
  }, [misconceptionSubmitted])

  return (
    <div className="container-page max-w-5xl animate-fade-in pb-20">
      <button onClick={() => navigate(`/learn/cbse/${classId}/${subjectId}/chapters/${chapterId}`)} className="btn-ghost mb-4 pl-0">
        <ArrowLeft size={18} className="mr-1" /> Back to {chapter?.title}
      </button>

      {/* Stage Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setLearningStage(0)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            learningStage === 0 ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
          }`}
        >
          <Eye size={16} /> Visual Explanation
        </button>
        <button
          onClick={() => setLearningStage(1)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            learningStage === 1 ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
          }`}
        >
          <BookOpen size={16} /> Conceptual Questions
        </button>
        <button
          onClick={() => setLearningStage(2)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            learningStage === 2 ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
          }`}
        >
          <BrainCircuit size={16} /> Misconception Check
        </button>
      </div>

      {/* STAGE 0: Smart Notebook */}
      {learningStage === 0 && (
        <div className="w-full animate-fade-in">
          <SmartNotebook 
            key={`${classId}-${subjectId}-${topicId}`}
            data={effectiveData}
            classId={classId}
            subject={subject?.label}
            chapterName={chapter?.title}
            topicName={topic.title}
            videoUrl={videoUrl}
          />
          <div className="mt-8 flex justify-end">
            <button onClick={() => setLearningStage(1)} className="btn-primary">
              Continue to Questions <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1: Questions */}
      {learningStage === 1 && (
        <div className="space-y-6 animate-fade-in">
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-10 text-center text-surface-muted">
              <p className="text-lg">No questions available for this topic yet.</p>
              <button onClick={() => setLearningStage(2)} className="btn-primary mt-6 mx-auto">
                Continue to Misconception Check <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
              <div className="flex gap-2 mb-6">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-all ${
                      currentQ === i ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-border bg-surface-card text-surface-muted'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <h3 className="text-xl font-bold mb-4">{questions[currentQ].text}</h3>
              <textarea
                value={answers[questions[currentQ].id] ?? ''}
                onChange={(e) => handleAnswerChange(questions[currentQ].id, e.target.value)}
                rows={5}
                className="input w-full p-4 rounded-xl border border-surface-border bg-surface/50 text-surface-text focus:border-primary-500 outline-none transition-all"
                placeholder="Type your explanation..."
              />
              <div className="mt-6 flex justify-between">
                <button disabled={currentQ === 0} onClick={() => setCurrentQ(i => i - 1)} className="btn-secondary">Previous</button>
                {currentQ < questions.length - 1 ? (
                  <button onClick={() => setCurrentQ(i => i + 1)} className="btn-primary">Next Question</button>
                ) : (
                  <button onClick={() => setLearningStage(2)} className="btn-primary">Continue to Misconceptions</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: Misconceptions */}
      {learningStage === 2 && (
        <div className="space-y-6 animate-fade-in">
          {misconceptions.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-10 text-center text-surface-muted">
              <p className="text-lg">No misconception probes available for this topic yet.</p>
              <div className="mt-8 flex justify-center gap-4">
                {prev && <button onClick={() => navigate(`/learn/cbse/${classId}/${subjectId}/chapters/${chapterId}/topics/${prev.id}`)} className="btn-secondary"><ArrowLeft size={16} className="mr-2" /> Previous Topic</button>}
                {next && <button onClick={() => navigate(`/learn/cbse/${classId}/${subjectId}/chapters/${chapterId}/topics/${next.id}`)} className="btn-primary">Next Topic <ArrowRight size={16} className="ml-2" /></button>}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-border bg-surface-card/70 p-6">
              <div className="mb-6 flex items-center gap-3">
                <BrainCircuit size={24} className="text-primary-500" />
                <h2 className="text-xl font-display font-bold">Misconception Check</h2>
              </div>
              <div className="space-y-6">
                {misconceptions.map((m, i) => (
                  <div key={m.id} className="rounded-xl border border-surface-border bg-surface/50 p-5">
                    <p className="font-semibold mb-4">{i + 1}. {m.probe}</p>
                    <div className="space-y-2">
                      {m.options.map((opt, oi) => (
                        <button
                          key={oi}
                          onClick={() => handleMisconceptionSelect(m.id, oi)}
                          disabled={misconceptionSubmitted}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                            misconceptionAnswers[m.id] === oi
                              ? (misconceptionSubmitted ? (oi === m.correctIndex ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-red-500 bg-red-500/10 text-red-500') : 'border-primary-500 bg-primary-500 text-white')
                              : (misconceptionSubmitted && oi === m.correctIndex ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-surface-border bg-surface-card text-surface-muted')
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {misconceptionSubmitted && (
                      <p className={`mt-4 text-sm ${misconceptionAnswers[m.id] === m.correctIndex ? 'text-green-500' : 'text-red-500'}`}>
                        {m.correction}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {!misconceptionSubmitted ? (
                <button 
                  onClick={() => setMisconceptionSubmitted(true)}
                  disabled={Object.keys(misconceptionAnswers).length < misconceptions.length}
                  className="btn-primary mt-6 w-full"
                >
                  Check My Understanding
                </button>
              ) : (
                <div className="mt-8 flex justify-between gap-4">
                  {prev && <button onClick={() => navigate(`/learn/cbse/${classId}/${subjectId}/chapters/${chapterId}/topics/${prev.id}`)} className="btn-secondary flex-1">Previous Topic</button>}
                  {next && <button onClick={() => navigate(`/learn/cbse/${classId}/${subjectId}/chapters/${chapterId}/topics/${next.id}`)} className="btn-primary flex-1">Next Topic</button>}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Utility screens ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  )
}

function ComingSoonScreen({ classId }) {
  const navigate = useNavigate()
  const n = classId.replace(/[^0-9]/g, '')
  const roman = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI',12:'XII'}
  const label = `Class ${roman[parseInt(n)] ?? n}`
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-cyan-500 shadow-[0_0_40px_rgba(108,99,255,0.4)]">
        <BookOpen className="h-9 w-9 text-white" />
      </div>
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-500/15 px-4 py-1.5 text-xs font-bold text-primary-400 uppercase tracking-widest">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
          CBSE Content In Progress
        </div>
        <h1 className="mt-4 text-3xl font-display font-bold text-surface-text">
          CBSE {label} — Coming Soon
        </h1>
        <p className="mt-3 max-w-md text-surface-muted leading-relaxed">
          We are currently building the CBSE {label} curriculum with NCERT-aligned chapters, animated video lessons, and AI-powered quizzes.
          <br /><br />
          <strong className="text-surface-text">Class IX is available now.</strong> More classes will be added progressively.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn-primary" onClick={() => navigate('/learn/cbse/class-9/subjects')}>
          Explore CBSE Class IX <ArrowRight size={16} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('/selection')}>
          <ArrowLeft size={16} /> Change Board
        </button>
      </div>
    </div>
  )
}

function ErrorScreen({ message, classId }) {
  const navigate = useNavigate()
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <p className="text-accent-rose">{message}</p>
      <button className="btn-primary" onClick={() => navigate('/selection')}>Back to Board Selection</button>
    </div>
  )
}
