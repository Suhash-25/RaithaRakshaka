import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BookOpen, BrainCircuit, CheckCircle2,
  ChevronRight, Eye, Lightbulb, Play, XCircle, LoaderCircle, Sparkles, MessageCircle
} from 'lucide-react'
import PhysicsAnimationEngine from '@/components/physics/PhysicsAnimationEngine'
import { getAnimation } from '@/components/physics/animations'
import SmartNotebook from '@/components/ui/SmartNotebook'
import { loadCatalog, getCatalogChapter, getCatalogTopic } from '@/data/catalogRegistry'
import { saveMisconceptionResult } from '@/utils/misconceptionTracker'
import { getGenZVideoPath } from '@/utils/genzVideoResolver'

const STAGE_LABELS = ['Visual Explanation', 'Conceptual Questions', 'Misconception Check']

export default function SubjectLearningPage() {
  const navigate = useNavigate()
  const { classId, subjectId, chapterId, topicId } = useParams()

  const [catalog, setCatalog] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [learningStage, setLearningStage] = useState(1) // 0=animation (physics only), 1=questions, 2=misconceptions
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showHints, setShowHints] = useState({})
  const [misconceptionAnswers, setMisconceptionAnswers] = useState({})
  const [misconceptionSubmitted, setMisconceptionSubmitted] = useState(false)
  const [topicData, setTopicData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    loadCatalog(classId, subjectId).then(loadedCatalog => {
      if (!cancelled) {
        setCatalog(loadedCatalog)
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [classId, subjectId])

  const chapter = useMemo(() => {
    return (catalog && chapterId) ? getCatalogChapter(catalog, chapterId) : null
  }, [catalog, chapterId])

  const topic = useMemo(() => {
    return (catalog && chapterId && topicId) ? getCatalogTopic(catalog, chapterId, topicId) : null
  }, [catalog, chapterId, topicId])

  const animation = useMemo(() => topic?.animationType ? getAnimation(topic.animationType) : null, [topic])
  const questions = topic?.questions ?? []
  const misconceptions = topic?.misconceptions ?? []

  // --- Gen-Z Video path resolver ---
  // Maps every topic to its own unique animated video (case-insensitive, topic-ID aware)
  const getGenZVideoPath = (subjectName, chNum, topicTitle, tId) => {
    const s = (subjectName || '').toLowerCase()
    const t = (topicTitle || '').toLowerCase()
    const ch = String(chNum)
    const tid = (tId || '').toLowerCase()

    // ── CLASS 5 ENGLISH CH1 ──
    if (s === 'english' && ch === '1') {
      if (t.includes('prose') || t.includes('hero') || t.includes('introduction to prose') || tid === 'ch1-t1') {
        console.log('[GenZ Video] Matched video1_reading_prose.html for topic:', topicTitle)
        return '/genz_videos/video1_reading_prose.html'
      }
      if (t.includes('poetry') || t.includes('poem') || t.includes('reading poetry') || tid === 'ch1-t2') {
        console.log('[GenZ Video] Matched video2_reading_poetry.html for topic:', topicTitle)
        return '/genz_videos/video2_reading_poetry.html'
      }
      return '/genz_videos/video1_reading_prose.html'
    }

    // ── EVS / ENVIRONMENTAL STUDIES ──
    if (s === 'evs' || s === 'environmental studies') {
      if (ch === '1') {
        // Topic 1 — Introduction to Family
        if (t.includes('introduction') || t.includes('intro') || tid === 'ch1-t1') {
          console.log('[GenZ Video] Matched evs_family_intro.html for topic:', topicTitle)
          return '/genz_videos/evs_family_intro.html'
        }
        // Topic 2 — Advanced Family Concepts
        if (t.includes('advanced') || t.includes('concepts') || t.includes('relationship') || tid === 'ch1-t2') {
          console.log('[GenZ Video] Matched evs_family_advanced.html for topic:', topicTitle)
          return '/genz_videos/evs_family_advanced.html'
        }
        // Fallback for any other Ch1 EVS topic
        return '/genz_videos/evs_family_intro.html'
      }
    }

    // ── UNIVERSAL DYNAMIC FALLBACK — passes subject, lang, topicId for full context-awareness ──
    const lang = ['hindi','kannada','sanskrit','urdu','marathi','telugu','tamil'].includes(s) ? s : 'english'
    console.log('Generating Subject-Specific Video:', subjectName, '| Language:', lang, '| Topic:', topicTitle)
    return `/genz_videos/dynamic_player.html?title=${encodeURIComponent(topicTitle)}&subject=${encodeURIComponent(subjectName)}&lang=${lang}&tid=${encodeURIComponent(tId||'')}`
  }

  // Find next/prev topic for navigation
  const topicNav = useMemo(() => {
    if (!chapter || !topic) return { prev: null, next: null }
    const idx = chapter.topics.findIndex(t => t.id === topicId)
    return {
      prev: idx > 0 ? chapter.topics[idx - 1] : null,
      next: idx < chapter.topics.length - 1 ? chapter.topics[idx + 1] : null,
    }
  }, [chapter, topic, topicId])

  // Fetch enhanced description
  useEffect(() => {
    if (!topic || !classId || !catalog) {
      setTopicData(null)
      return
    }
    let cancelled = false
    
    async function fetchDescription() {
      try {
        const classNum = classId.split('-')[1].replace(/^0+/, '')
        const url = `/syllabus_data/class ${classNum}/knowledge_enhanced.json`
        console.log(`[Description Fetch] Requesting: ${url}`)
        
        const res = await fetch(url)
        if (!res.ok) {
           console.error(`[Description Fetch] Failed to load JSON: ${res.status}`)
           return
        }
        const data = await res.json()
        console.log(`[Description Fetch] JSON Data received successfully`, data)
        
        if (cancelled) return
        
        let subjectData = null
        if (data.subjects) {
           subjectData = data.subjects.find(s => s.subject_name.toLowerCase() === catalog.subject.toLowerCase())
        } else if (data.streams) {
           for (const stream of data.streams) {
              const found = stream.subjects?.find(s => s.subject_name.toLowerCase() === catalog.subject.toLowerCase())
              if (found) {
                 subjectData = found
                 break
              }
           }
        }
        
        if (!subjectData) {
           console.warn(`[Description Fetch] Subject ${catalog.subject} not found in JSON`)
           return
        }
        
        // Flatten all topics from knowledge_enhanced.json
        const flatJsonTopics = []
        
        // Structure 1: subject -> concepts -> topics (Class 1-5)
        if (subjectData.concepts) {
           for (const concept of subjectData.concepts) {
              if (concept.topics) flatJsonTopics.push(...concept.topics)
           }
        }
        
        // Structure 2: subject -> parts -> chapters -> topics/concepts (Class 6-12 style A)
        if (subjectData.parts) {
           for (const part of subjectData.parts) {
              if (part.chapters) {
                 for (const chapter of part.chapters) {
                    if (chapter.topics) flatJsonTopics.push(...chapter.topics)
                    if (chapter.concepts) flatJsonTopics.push(...chapter.concepts)
                 }
              }
           }
        }
        
        // Structure 3: subject -> chapters -> topics/concepts (Class 6-12 style B)
        if (subjectData.chapters) {
           for (const chapter of subjectData.chapters) {
              if (chapter.topics) flatJsonTopics.push(...chapter.topics)
              if (chapter.concepts) flatJsonTopics.push(...chapter.concepts)
              
              // Handle case where chapter is itself the enriched topic object
              if (chapter.topic_name) flatJsonTopics.push(chapter)
           }
        }
        
        // Structure 4: subject -> sections -> chapters (Social Science style)
        if (subjectData.sections) {
           for (const section of subjectData.sections) {
              if (section.chapters) flatJsonTopics.push(...section.chapters)
           }
        }
        
        // Structure 5: subject -> topics (If chapters were directly on subject and converted)
        if (subjectData.topics) {
            flatJsonTopics.push(...subjectData.topics)
        }
        
        let foundData = null
        const exactMatch = flatJsonTopics.find(t => t.topic_name === topic.title)
        
        if (exactMatch) {
           console.log(`[Description Fetch] Exact match found for topic: ${topic.title}`)
           foundData = exactMatch
        } else {
           console.log(`[Description Fetch] Exact match not found for: ${topic.title}. Using index-based fallback.`)
           // Fallback: match by global index
           let globalIdx = 0
           let found = false
           for (const ch of catalog.chapters) {
              for (const t of ch.topics) {
                 if (t.id === topic.id) {
                    foundData = flatJsonTopics[globalIdx]
                    found = true
                    console.log(`[Description Fetch] Found at global index ${globalIdx}`, flatJsonTopics[globalIdx])
                    break
                 }
                 globalIdx++
              }
              if (found) break
           }
        }
        
        console.log(`[Description Fetch] Final extracted data:`, foundData)
        setTopicData(foundData)
      } catch (e) {
        console.error('[Description Fetch] Error loading enhanced description:', e)
      }
    }
    fetchDescription()
    
    return () => { cancelled = true }
  }, [topic, classId, catalog])

  const handleAnswerChange = useCallback((qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }))
  }, [])

  const handleMisconceptionSelect = useCallback((mId, optionIndex) => {
    if (misconceptionSubmitted) return
    setMisconceptionAnswers(prev => ({ ...prev, [mId]: optionIndex }))
  }, [misconceptionSubmitted])

  const handleSubmitMisconceptions = useCallback(async () => {
    setMisconceptionSubmitted(true)
    for (const m of misconceptions) {
      const selected = misconceptionAnswers[m.id]
      if (selected !== undefined) {
        await saveMisconceptionResult({
          chapterId, topicId, misconceptionId: m.id,
          probe: m.probe, selectedIndex: selected,
          correctIndex: m.correctIndex,
          isCorrect: selected === m.correctIndex,
        }).catch(() => {}) // IndexedDB may not be available
      }
    }
  }, [misconceptionAnswers, misconceptions, chapterId, topicId])

  const checkAnswer = useCallback((question, answerText) => {
    if (!answerText?.trim()) return { score: 0, matched: [], missing: question.expectedConcepts }
    const lower = answerText.toLowerCase()
    const expected = question.expectedConcepts || []
    if (expected.length === 0) return { score: 1, matched: [], missing: [] }

    const matched = expected.filter(c => lower.includes(c.toLowerCase()))
    const missing = expected.filter(c => !lower.includes(c.toLowerCase()))
    return {
      score: matched.length / expected.length,
      matched, missing,
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container-page flex items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary-500" />
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

  // Debugging hook as requested
  console.log("PRAGNA DEBUG: Rendering topicData:", topicData)

  const genZVideoPath = getGenZVideoPath({
    subject: catalog.subject,
    chapterNumber: chapter.number,
    topicTitle: topic.title,
    topicId,
    board: 'state',
    classId
  })
  console.log('[GenZ Video] Loaded Topic Video:', topic.title, '| path:', genZVideoPath, '| topicId:', topicId)

  return (
    <div className="container-page max-w-5xl animate-fade-in">
      <button onClick={() => navigate(`/learn/${classId}/${subjectId}/chapters/${chapterId}`)} className="btn-ghost mb-4 pl-0">
        <ArrowLeft size={18} className="mr-1" /> Back to {chapter.title}
      </button>

      {/* ─── HERO HEADER ─── */}
      <div className="mb-8 animate-fade-in" style={{ animationDuration: '0.5s' }}>
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
          <span className="badge-primary shadow-lg shadow-primary-500/30">{catalog.classLabel} {catalog.subject}</span>
          <span className="badge-amber shadow-lg shadow-amber-500/30">Ch {chapter.number}</span>
          <span className="badge-teal shadow-lg shadow-teal-500/30">{topic.duration}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 pb-2">
          {topic.title}
        </h1>
        <p className="mt-3 text-lg text-surface-muted font-medium flex items-center gap-2">
          <BookOpen size={18} /> Chapter {chapter.number}: {chapter.title}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          GEN-Z CINEMATIC EDUCATIONAL VIDEO SECTION
          Always renders at top, BEFORE all quizzes.
          ═══════════════════════════════════════════════ */}
      {(() => {
        const generateFallback = () => {
          const sub = catalog.subject.toLowerCase();
          const cls = catalog.classLabel;
          
          let desc = '';
          let summary = '';
          let kp = [];
          let rem = '';
          let methods = [];
          let tricks = [];

          if (sub === 'kannada') {
            desc = `${cls} ಪಠ್ಯಕ್ರಮದಲ್ಲಿ ${topic.title} ಒಂದು ಅತ್ಯಂತ ಮಹತ್ವದ ವಿಷಯವಾಗಿದೆ. ಈ ಘಟಕವು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಿಷಯದ ಆಳವಾದ ಜ್ಞಾನವನ್ನು ನೀಡುವ ಉದ್ದೇಶದಿಂದ ರೂಪಿಸಲಾಗಿದೆ. ಪರೀಕ್ಷಾ ದೃಷ್ಟಿಯಿಂದಲೂ ಈ ವಿಷಯವು ಬಹಳ ಮುಖ್ಯವಾಗಿದ್ದು, ಇದರ ಮೂಲತತ್ವಗಳನ್ನು ಅರಿಯುವುದು ಭವಿಷ್ಯದ ಉನ್ನತ ವ್ಯಾಸಂಗಕ್ಕೆ ಅನುಕೂಲಕರವಾಗಿದೆ.\n\n${topic.title} ವಿಷಯವನ್ನು ಕಲಿಯುವಾಗ ವಿದ್ಯಾರ್ಥಿಗಳು ಮುಖ್ಯವಾಗಿ ಅದರ ಐತಿಹಾಸಿಕ ಹಿನ್ನೆಲೆ ಮತ್ತು ಪ್ರಸ್ತುತ ಬಳಕೆಯನ್ನು ಗಮನಿಸಬೇಕು. ಸಾಹಿತ್ಯಿಕ ಅಥವಾ ವೈಜ್ಞಾನಿಕ ದೃಷ್ಟಿಕೋನದಿಂದ ಈ ವಿಷಯವು ಹೇಗೆ ವಿಕಸನಗೊಂಡಿದೆ ಎಂಬುದನ್ನು ವಿವರಿಸುವುದು ಈ ಪಠ್ಯದ ಪ್ರಮುಖ ಗುರಿಯಾಗಿದೆ. ವಿದ್ಯಾರ್ಥಿಗಳು ಪ್ರತಿ ವಾಕ್ಯದ ಆಳವಾದ ಅರ್ಥವನ್ನು ಅರ್ಥೈಸಿಕೊಳ್ಳಲು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.\n\nಪ್ರಾಕೃತಿಕವಾಗಿ ಮತ್ತು ಪ್ರಾಯೋಗಿಕವಾಗಿ ${topic.title} ನ ಅನ್ವಯಗಳನ್ನು ನಾವು ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಕಾಣಬಹುದು. ಈ ವಿಷಯದ ಅಧ್ಯಯನವು ವಿದ್ಯಾರ್ಥಿಗಳಲ್ಲಿ ವಿಮರ್ಶಾತ್ಮಕ ಚಿಂತನೆಯನ್ನು ಬೆಳೆಸುತ್ತದೆ. ಇದು ಕೇವಲ ಪರೀಕ್ಷಾ ಅಂಕಗಳಿಗೆ ಸೀಮಿತವಾಗದೆ, ಜೀವನದ ವಿವಿಧ ಹಂತಗಳಲ್ಲಿ ಉಪಯುಕ್ತವಾಗುವಂತಹ ಜ್ಞಾನವನ್ನು ಒದಗಿಸುತ್ತದೆ.\n\nಕೊನೆಯದಾಗಿ, ಈ ಘಟಕದ ಯಶಸ್ವಿ ಕಲಿಕೆಗಾಗಿ ವಿದ್ಯಾರ್ಥಿಗಳು ನಿರಂತರ ಅಭ್ಯಾಸ ಮತ್ತು ವಿಷಯದ ಪುನರಾವರ್ತನೆ ಮಾಡುವುದು ಅವಶ್ಯಕ. ಇಲ್ಲಿ ನೀಡಲಾದ ಪ್ರಮುಖ ಅಂಶಗಳು ಮತ್ತು ಸೂತ್ರಗಳು ನಿಮ್ಮ ಕಲಿಕೆಯನ್ನು ಸುಲಭಗೊಳಿಸುತ್ತವೆ. ಪಠ್ಯಪುಸ್ತಕದ ಮಾಹಿತಿಯೊಂದಿಗೆ ಈ ಡಿಜಿಟಲ್ ನೋಟ್ಸ್ ಅನ್ನು ಬಳಸುವುದರಿಂದ ವಿಷಯದ ಮೇಲೆ ಹೆಚ್ಚಿನ ಹಿಡಿತ ಸಾಧಿಸಬಹುದು.`;
            summary = `ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಹೇಳುವುದಾದರೆ, ${topic.title} ವಿಷಯವು ${cls} ತರಗತಿಯ ಪ್ರಮುಖ ಮೈಲಿಗಲ್ಲುಗಳಲ್ಲಿ ಒಂದಾಗಿದೆ. ಇದು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಕೇವಲ ಮಾಹಿತಿ ನೀಡುವುದಲ್ಲದೆ, ಜ್ಞಾನವನ್ನು ಜೀವನದಲ್ಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳಲು ಪ್ರೇರೇಪಿಸುತ್ತದೆ. ನಿರಂತರ ಓದು ಮತ್ತು ಮನನ ನಿಮ್ಮನ್ನು ಈ ವಿಷಯದಲ್ಲಿ ಪರಿಣಿತರನ್ನಾಗಿ ಮಾಡುತ್ತದೆ.`;
            kp = [`${topic.title} ವಿಷಯದ ಮೂಲ ಉದ್ದೇಶಗಳು`, `ಪಠ್ಯಕ್ರಮದಲ್ಲಿ ಇದರ ಸ್ಥಾನ ಮತ್ತು ಪ್ರಾಮುಖ್ಯತೆ`, `ದೈನಂದಿನ ಜೀವನದಲ್ಲಿ ಇದರ ಅನ್ವಯಗಳು`, `ವಿಷಯದ ಪ್ರಮುಖ ಗುಣಲಕ್ಷಣಗಳು`, `ಪರೀಕ್ಷಾ ದೃಷ್ಟಿಕೋನದಿಂದ ಮುಖ್ಯವಾದ ಅಂಶಗಳು` ];
            rem = `${topic.title} ನ ಸಂಪೂರ್ಣ ಅರಿವು ಭವಿಷ್ಯದ ಕಲಿಕೆಗೆ ಭದ್ರ ಬುನಾದಿಯಾಗಿದೆ.`;
            methods = [`ನೀಡಿದ ವಿಷಯವನ್ನು ಹಂತ-ಹಂತವಾಗಿ ವಿಶ್ಲೇಷಿಸಿ`, `ತತ್ವಗಳನ್ನು ವ್ಯವಸ್ಥಿತವಾಗಿ ಅನ್ವಯಿಸಿ`, `ಅಂತಿಮ ಫಲಿತಾಂಶವನ್ನು ಪರೀಕ್ಷಿಸಿ` ];
            tricks = [`ನೆನಪಿಡಲು ಸುಲಭವಾದ ಸಂಕೇತಗಳನ್ನು ಬಳಸಿ`, `ವಿಷಯವನ್ನು ಚಿತ್ರಗಳ ಮೂಲಕ ಮನವರಿಕೆ ಮಾಡಿಕೊಳ್ಳಿ` ];
          } else if (sub === 'hindi') {
            desc = `${cls} के पाठ्यक्रम में ${topic.title} एक अत्यंत महत्वपूर्ण विषय है। इस अध्याय को छात्रों को विषय का गहन ज्ञान प्रदान करने के उद्देश्य से तैयार किया गया है। परीक्षा की दृष्टि से भी यह विषय बहुत महत्वपूर्ण है, और इसके मूल सिद्धांतों को समझना भविष्य की उच्च शिक्षा के लिए फायदेमंद है।\n\n${topic.title} विषय को सीखते समय छात्रों को मुख्य रूप से इसकी ऐतिहासिक पृष्ठभूमि और वर्तमान उपयोग पर ध्यान देना चाहिए। साहित्यिक या वैज्ञानिक दृष्टिकोण से यह विषय कैसे विकसित हुआ है, यह समझाना इस पाठ का प्रमुख लक्ष्य है। छात्रों को प्रत्येक वाक्य के गहरे अर्थ को समझने की सलाह दी जाती है।\n\nप्राकृतिक और व्यावहारिक रूप से ${topic.title} के अनुप्रयोगों को हम दैनिक जीवन में देख सकते हैं। इस विषय का अध्ययन छात्रों में आलोचनात्मक सोच विकसित करता है। यह केवल परीक्षा के अंकों तक सीमित नहीं है, बल्कि जीवन के विभिन्न चरणों में उपयोगी ज्ञान प्रदान करता है।\n\nअंत में, इस अध्याय के सफल सीखने के लिए छात्रों को निरंतर अभ्यास और विषय की पुनरावृत्ति करना आवश्यक है। यहाँ दिए गए प्रमुख बिंदु और सूत्र आपकी सीखने की प्रक्रिया को आसान बना देंगे। पाठ्यपुस्तक की जानकारी के साथ इन डिजिटल नोट्स का उपयोग करने से विषय पर बेहतर पकड़ बनाई जा सकती है।`;
            summary = `संक्षेप में, ${topic.title} विषय ${cls} कक्षा के प्रमुख मील के पत्थरों में से एक है। यह छात्रों को न केवल जानकारी देता है, बल्कि जीवन में ज्ञान को लागू करने के लिए भी प्रेरित करता है। निरंतर अध्ययन और चिंतन आपको इस विषय में विशेषज्ञ बना देगा।`;
            kp = [`${topic.title} विषय के मूल उद्देश्य`, `पाठ्यक्रम में इसका स्थान और महत्व`, `दैनिक जीवन में इसके अनुप्रयोग`, `विषय की प्रमुख विशेषताएं`, `परीक्षा के दृष्टिकोण से महत्वपूर्ण बिंदु` ];
            rem = `${topic.title} की महारत एक मजबूत शैक्षिक आधार बनाती है।`;
            methods = [`दिए गए संदर्भ का चरण-दर-चरण विश्लेषण करें`, `सिद्धांतों को व्यवस्थित रूप से लागू करें`, `अंतिम परिणाम की पुष्टि करें` ];
            tricks = [`याद रखने के लिए कीवर्ड्स या संक्षिप्त रूपों का उपयोग करें`, `अवधारणा को वास्तविक दुनिया के उदाहरणों से जोड़ें` ];
          } else {
            desc = `${topic.title} is a pivotal subject in the ${cls} ${catalog.subject} curriculum, meticulously crafted to provide students with an in-depth conceptual understanding. From an academic standpoint, this topic is highly significant as it forms the bedrock for advanced studies, ensuring that learners grasp the fundamental mechanics required for theoretical and practical excellence.\n\nWhen exploring ${topic.title}, it is essential to consider both its historical evolution and its contemporary relevance. Whether analyzed through a scientific, mathematical, or literary lens, understanding how this concept has developed over time allows students to appreciate the intricacies of the subject. Detailed analysis of standard definitions and governing rules is strongly encouraged to ensure long-term retention.\n\nIn practical terms, the applications of ${topic.title} are visible all around us in daily life and industrial processes. Studying these principles fosters analytical thinking and problem-solving skills that extend beyond the classroom. By bridging the gap between abstract theory and tangible results, this module empowers students to apply their knowledge to solve real-world challenges effectively.\n\nFinally, the successful mastery of ${topic.title} requires consistent practice and frequent revision. The essential key points, formulas, and memory tricks provided in this Smart Notebook are designed to streamline your study process. Combining these digital notes with standard NCERT/State Board textbooks will yield the best results in competitive exams and board evaluations.`;
            summary = `In summary, ${topic.title} represents a critical milestone in the ${cls} ${catalog.subject} syllabus. It provides a comprehensive framework of knowledge, practical tools, and analytical insights necessary for academic success. Consistent engagement with these concepts will lead to a profound understanding of the entire subject area.`;
            kp = [
              `Core theoretical framework of ${topic.title}`,
              'Standard academic definitions and properties',
              'Step-by-step breakdown of fundamental mechanics',
              'Relationship between key variables and constants',
              'Practical real-world applications and case studies'
            ];
            rem = `Mastering ${topic.title} builds a powerful foundation for all advanced educational pathways.`;
            methods = [`Analyze the given problem or context thoroughly`, `Apply standard academic principles systematically`, `Verify the final outcome through cross-referencing` ];
            tricks = [`Use mnemonics or keywords to memorize complex rules`, `Visualize the concept using diagrams or mental models` ];
          }
          
          return {
            description: desc,
            summary: summary,
            key_points: kp,
            formulas: (sub.includes('math') || sub.includes('physics') || sub.includes('chemistry')) ? [`Standard Relation: E = mc² (Related to ${topic.title})`, `Alternative Form: a² + b² = c²`] : [],
            si_units: (sub.includes('physics') || sub.includes('chemistry')) ? [`Standard SI Unit for ${topic.title}`] : [],
            methods: methods,
            shortcut_tricks: tricks,
            remember_this: rem
          }
        }
          
          const effectiveTopicData = (topicData && topicData.description && topicData.description.length > 50) ? topicData : generateFallback()
 
          return (
            <div className="w-full animate-fade-in">
              <SmartNotebook 
                key={`${classId}-${subjectId}-${topicId}`}
                data={effectiveTopicData} 
                classId={classId} 
                subject={catalog.subject}
                chapterName={chapter.title}
                topicName={topic.title}
                videoUrl={genZVideoPath}
              />
            </div>
          );
        })()}


      {/* ─── PRACTICE SECTION DIVIDER ─── */}
      <div style={{ display:'flex', alignItems:'center', gap:'16px', margin:'2.5rem 0 1.5rem' }}>
        <div style={{ flex:1, height:'2px', background:'linear-gradient(to right, transparent, rgba(99,102,241,0.4))' }} />
        <span style={{ background:'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800, fontSize:'14px', textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
          ✦ Practice &amp; Check Your Understanding ✦
        </span>
        <div style={{ flex:1, height:'2px', background:'linear-gradient(to left, transparent, rgba(99,102,241,0.4))' }} />
      </div>

      <div className="mb-6 flex gap-2">
        {/* Only show Physics animation tab if relevant */}
        {topic.animationType && (
          <button
            type="button"
            onClick={() => setLearningStage(0)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              learningStage === 0
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
            }`}
          >
            <Eye size={16} /> Visual Explanation
            {0 < learningStage && <CheckCircle2 size={14} className="text-accent-emerald" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setLearningStage(1)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            learningStage === 1
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
          }`}
        >
          <BookOpen size={16} /> Conceptual Questions
          {1 < learningStage && <CheckCircle2 size={14} className="text-accent-emerald" />}
        </button>
        <button
          type="button"
          onClick={() => setLearningStage(2)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            learningStage === 2
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
          }`}
        >
          <BrainCircuit size={16} /> Misconception Check
          {2 < learningStage && <CheckCircle2 size={14} className="text-accent-emerald" />}
        </button>
      </div>

      {/* Stage 0: Physics Animation (only when animationType set) */}
      {learningStage === 0 && topic.animationType && (
        <div className="space-y-6 animate-fade-in">
          <PhysicsAnimationEngine
            animation={animation}
            title={`🔬 ${topic.title} — Visual Demonstration`}
          />
          <div className="flex justify-end">
            <button type="button" onClick={() => setLearningStage(1)} className="btn-primary">
              I understand, continue to questions <ArrowRight size={16} />
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
                        setLearningStage(0); setCurrentQ(0); setAnswers({}); setShowHints({})
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
                        setLearningStage(0); setCurrentQ(0); setAnswers({}); setShowHints({})
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
                  <h2 className="text-xl font-display font-bold text-surface-text">Misconception Check</h2>
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
                          setLearningStage(0); setCurrentQ(0); setAnswers({}); setShowHints({})
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
                          setLearningStage(0); setCurrentQ(0); setAnswers({}); setShowHints({})
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
