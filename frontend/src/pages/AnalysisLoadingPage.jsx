import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftIcon, SparklesIcon } from '@/components/ui/Icons'
import { analyzeResponse, generateExplanation } from '@/services/api'
import { notifyOfflineSyncStateChanged } from '@/services/offlineSync'
import {
  getCachedExplanation,
  saveCachedExplanation,
  saveExplanationDraft,
  saveProgressEvent,
  updateResponse,
} from '@/utils/indexedDB'
import { buildExplanationCacheId } from '@/utils/offlineEngine'
import { getMasteryScore } from '@/utils/progressAnalytics'
import { getCurrentStudent } from '@/services/studentManagement'

const FALLBACK_EXPLANATION = {
  type: 'hybrid',
  content: 'Start with the core idea, then explain why it applies to this question in one simple step.',
  story: 'Think of learning like following a recipe: naming the ingredient is useful, but the order and reason make the dish work.',
  diagram: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 180'><rect width='520' height='180' rx='18' fill='#0f172a'/><g fill='none' stroke='#2dd4bf' stroke-width='4'><path d='M75 90h120'/><path d='M195 90l-18-14m18 14l-18 14'/><path d='M245 90h120'/><path d='M365 90l-18-14m18 14l-18 14'/></g><g fill='#e2e8f0' font-family='Inter,Arial' font-size='18' text-anchor='middle'><text x='80' y='96'>Idea</text><text x='260' y='96'>Reason</text><text x='430' y='96'>Answer</text></g></svg>",
}

function subjectSlug(label) {
  return label?.trim().toLowerCase().replace(/\s+/g, '-') || undefined
}

function getProgressWriteKey(responseId, answer, topicId) {
  return `progress:${responseId ?? answer?.questionId ?? 'question'}:${topicId ?? 'topic'}:${answer?.answerText?.trim() ?? ''}`
}

export default function AnalysisLoadingPage() {
  const { state } = useLocation()
  const responseId = state?.responseId
  const answer = state?.answer
  const topicContext = state?.topicContext ?? null
  const topicId = state?.topicId
  const topicLabel = state?.topicLabel ?? topicContext?.topicLabel ?? answer?.topicLabel ?? 'selected topic'
  const subjectLabel = state?.subjectLabel ?? topicContext?.subjectLabel ?? answer?.subjectLabel
  const subjectId = topicContext?.subjectId ?? answer?.subjectId
  const answerPreview = answer?.answerText ?? ''
  const explanationCacheId = buildExplanationCacheId(responseId, answer?.questionId, topicId)
  const syllabusLink = topicContext?.classSlug && topicContext?.subjectId && topicContext?.documentId
    ? `/classes/${topicContext.classSlug}/subjects/${topicContext.subjectId}/documents/${topicContext.documentId}`
    : '/selection'

  const [analysis, setAnalysis] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadExplanation() {
      if (!answer) {
        setStatus('ready')
        setExplanation(FALLBACK_EXPLANATION)
        return
      }

      try {
        const cached = await getCachedExplanation(explanationCacheId)
        const canUseCached =
          cached?.analysis &&
          cached?.explanation &&
          (cached.syncStatus === 'synced' || typeof navigator === 'undefined' || !navigator.onLine)

        if (!cancelled && canUseCached) {
          setAnalysis(cached.analysis)
          setExplanation(cached.explanation)
          setStatus('ready')
          return
        }
      } catch {
        // Ignore cache lookup failures and continue to fresh generation.
      }

      try {
        const analysisResult = await analyzeResponse({
          question: answer.questionText,
          student_answer: answer.answerText,
          subject: subjectId ?? subjectSlug(subjectLabel),
          topic_id: topicId,
          question_id: answer.questionId,
          class_label: topicContext?.classLabel ?? answer?.classLabel,
          document_title: topicContext?.documentTitle ?? answer?.documentTitle,
          chapter_label: topicContext?.chapterLabel ?? answer?.chapterLabel,
        })

        const explanationResult = await generateExplanation({
          misconception_type: analysisResult.misconception_type,
          topic: topicLabel,
          topic_id: topicId,
          subject: analysisResult.subject,
          question_id: answer.questionId,
          question_text: answer.questionText,
          student_answer: answer.answerText,
          class_label: topicContext?.classLabel ?? answer?.classLabel,
          document_title: topicContext?.documentTitle ?? answer?.documentTitle,
          chapter_label: topicContext?.chapterLabel ?? answer?.chapterLabel,
          include_visual: true,
        })

        if (!cancelled) {
          const currentStudent = await getCurrentStudent().catch(() => null)
          const syncStatus =
            analysisResult.analysis_method === 'frontend_offline_engine' ||
            explanationResult.source === 'offline_template'
              ? 'pending'
              : 'synced'
          const masteryScore = getMasteryScore({
            isCorrect: analysisResult.is_correct,
            misconceptionType: analysisResult.misconception_type,
            confidence: analysisResult.confidence,
          })
          const progressWriteKey = getProgressWriteKey(responseId, answer, topicId)

          if (responseId) {
            try {
              await updateResponse(responseId, {
                status: 'analyzed',
                misconceptionType: analysisResult.misconception_type,
                confidenceLevel: analysisResult.confidence_level,
                confidence: analysisResult.confidence,
                correctiveGuidance: analysisResult.corrective_guidance,
                masteryScore,
                isCorrect: analysisResult.is_correct,
                syncStatus,
                lastSyncError: '',
                analysisSource: analysisResult.analysis_method ?? 'offline_rule_engine',
                explanationSource: explanationResult.source,
              })
            } catch {
              // Progress view should still work even if response update fails.
            }
          }

          try {
            if (typeof window !== 'undefined' && !window.sessionStorage.getItem(progressWriteKey)) {
              await saveProgressEvent({
                student_id: currentStudent?.id ?? 'guest',
                studentName: currentStudent?.name ?? 'Guest student',
                responseId,
                questionId: answer.questionId,
                questionText: answer.questionText,
                subjectId,
                subjectLabel,
                classLabel: topicContext?.classLabel ?? answer?.classLabel,
                documentId: topicContext?.documentId ?? answer?.documentId,
                documentTitle: topicContext?.documentTitle ?? answer?.documentTitle,
                chapterId: topicContext?.chapterId ?? answer?.chapterId,
                chapterLabel: topicContext?.chapterLabel ?? answer?.chapterLabel,
                topicId,
                topicLabel,
                misconceptionType: analysisResult.misconception_type,
                confidence: analysisResult.confidence,
                confidenceLevel: analysisResult.confidence_level,
                masteryScore,
                isCorrect: analysisResult.is_correct,
                answerLength: answer.answerText?.trim().length ?? 0,
              })
              window.sessionStorage.setItem(progressWriteKey, 'saved')
            }
          } catch {
            // Local analytics persistence should not block student feedback.
          }

          try {
            await saveCachedExplanation({
              id: explanationCacheId,
              responseId,
              questionId: answer.questionId,
              questionText: answer.questionText,
              topicId,
              topicLabel,
              subjectLabel,
              analysis: analysisResult,
              explanation: explanationResult,
              source: explanationResult.source,
              syncStatus,
            })
          } catch {
            // Cached explanation failures should not block the explanation view.
          }

          try {
            await saveExplanationDraft({
              id: `${answer.questionId ?? 'question'}-${topicId ?? 'topic'}-${Date.now()}`,
              questionId: answer.questionId,
              questionText: answer.questionText,
              studentAnswer: answer.answerText,
              subject: analysisResult.subject,
              topic: topicLabel,
              topicId,
              misconceptionType: analysisResult.misconception_type,
              confidenceLevel: analysisResult.confidence_level,
              content: explanationResult.content,
              story: explanationResult.story,
              diagram: explanationResult.diagram,
              type: explanationResult.type,
              source: explanationResult.source,
              enhancedByAi: explanationResult.enhanced_by_ai,
            })
          } catch {
            // Draft persistence should not block the student explanation view.
          }
          setAnalysis(analysisResult)
          setExplanation(explanationResult)
          setStatus('ready')
          notifyOfflineSyncStateChanged()
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setExplanation(FALLBACK_EXPLANATION)
          setStatus('ready')
        }
      }
    }

    loadExplanation()

    return () => {
      cancelled = true
    }
  }, [answer, explanationCacheId, responseId, subjectId, subjectLabel, topicContext, topicId, topicLabel])

  if (status === 'loading') {
    return (
      <div className="container-page max-w-3xl animate-fade-in">
        <section className="card overflow-hidden text-center">
          <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-primary-500 bg-surface-card">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent-teal/30 bg-accent-teal/10 animate-pulse-slow">
              <SparklesIcon className="h-9 w-9 text-accent-teal" />
            </div>
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
            AI analyzing...
          </p>
          <h1 className="text-3xl font-display font-bold text-surface-text">
            Building your explanation
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-surface-muted">
            Using offline rules first. AI enhancement is optional.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <div className="progress-track">
              <div className="progress-fill w-2/3 animate-pulse" />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="container-page max-w-4xl animate-fade-in">
      <section className="card overflow-hidden">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {topicContext?.chapterLabel && <span className="badge-amber mr-2">{topicContext.chapterLabel}</span>}
            <span className="badge-teal">{topicLabel}</span>
            {analysis?.confidence_level && (
              <span className="badge-primary ml-2">{analysis.confidence_level}</span>
            )}
            {analysis?.analysis_method === 'frontend_offline_engine' && (
              <span className="badge-amber ml-2">Offline-ready</span>
            )}
            {explanation?.enhanced_by_ai && (
              <span className="badge-amber ml-2">Enhanced by AI</span>
            )}
          </div>
          <span className="text-xs text-surface-muted">{explanation?.type ?? 'hybrid'} explanation</span>
        </div>

        <h1 className="mb-6 text-3xl font-display font-bold text-surface-text">
          {analysis?.misconception_type ?? 'Explanation'}
        </h1>

        {explanation?.diagram && (
          <div
            className="mb-6 overflow-hidden rounded-2xl border border-surface-border bg-surface/40"
            dangerouslySetInnerHTML={{ __html: explanation.diagram }}
            aria-label="Explanation diagram"
          />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-primary-500 bg-surface-card p-5">
            <div className="mb-3 flex items-center gap-2 text-primary-500">
              <SparklesIcon className="h-4 w-4" />
              <h2 className="font-semibold text-surface-text">Simple idea</h2>
            </div>
            <p className="text-sm leading-relaxed text-surface-muted">
              {explanation?.content}
            </p>
          </article>

          <article className="rounded-2xl border border-accent-amber/20 bg-accent-amber/5 p-5">
            <h2 className="mb-3 font-semibold text-surface-text">Story analogy</h2>
            <p className="text-sm leading-relaxed text-surface-muted">
              {explanation?.story}
            </p>
          </article>
        </div>

        {answerPreview && (
          <div className="mt-6 rounded-2xl border border-surface-border bg-surface/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-surface-text">Your answer</span>
              <span className="text-xs text-surface-muted">Saved locally</span>
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-surface-muted">
              {answerPreview}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-accent-amber">
            Showing offline fallback explanation. {error}
          </p>
        )}

        {analysis?.analysis_method === 'frontend_offline_engine' && (
          <p className="mt-4 text-xs text-surface-muted">
            This explanation was generated locally and will refresh with synced content when the app is back online.
          </p>
        )}
      </section>

      <div className="mt-6 flex justify-center">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to={syllabusLink} className="btn-secondary">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to syllabus
          </Link>
          <Link to="/progress" className="btn-primary">
            <SparklesIcon className="h-4 w-4" />
            View progress
          </Link>
        </div>
      </div>
    </div>
  )
}
