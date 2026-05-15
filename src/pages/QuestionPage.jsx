import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ClockIcon, LightBulbIcon, MicrophoneIcon, PaperAirplaneIcon, SparklesIcon } from '@/components/ui/Icons'
import { useLearningSelection } from '@/context/LearningSelectionContext'
import { getQuestionForTopic } from '@/services/offlineContent'
import { notifyOfflineSyncStateChanged } from '@/services/offlineSync'
import { saveResponse } from '@/utils/indexedDB'
import { resolveTopicContext } from '@/utils/syllabusPractice'
import useVoiceInput from '@/hooks/useVoiceInput'
import { t } from '@/utils/translations'
import { useLanguage } from '@/context/LanguageContext'

export default function QuestionPage() {
  const { topicId } = useParams()
  const { state: locationState } = useLocation()
  const navigate = useNavigate()
  const { selection } = useLearningSelection()
  const { language } = useLanguage()

  const topicContext = useMemo(
    () => resolveTopicContext(topicId, locationState ?? {}, selection),
    [locationState, selection, topicId],
  )
  const subjectId = topicContext.subjectId
  const subjectLabel = topicContext.subjectLabel
  const topicLabel = topicContext.topicLabel

  const [question, setQuestion] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true)
  const [questionError, setQuestionError] = useState('')

  const { isListening, voiceError, toggleListening } = useVoiceInput(language, (newFinal, currentInterim) => {
    if (newFinal) {
      setAnswerText((current) => [current.trim(), newFinal.trim()].filter(Boolean).join(' '))
    }
    setInterimText(currentInterim)
  })

  const answerReady = answerText.trim().length > 0

  useEffect(() => {
    let active = true

    async function loadQuestion() {
      setIsLoadingQuestion(true)
      setQuestionError('')

      try {
        const nextQuestion = await getQuestionForTopic(topicId, topicContext)

        if (active) {
          if (nextQuestion) {
            setQuestion(nextQuestion)
          } else {
            setQuestionError('No offline question is available for this topic yet.')
          }
        }
      } catch {
        if (active) {
          setQuestionError('Could not load the offline question pack.')
        }
      } finally {
        if (active) {
          setIsLoadingQuestion(false)
        }
      }
    }

    loadQuestion()

    return () => {
      active = false
    }
  }, [topicContext, topicId])

  async function handleSubmit() {
    if (!answerReady || isSubmitting || !question) return

    setSubmitError('')
    setIsSubmitting(true)

    const answer = {
      questionId: question.id,
      questionText: question.text,
      answerText: answerText.trim(),
      inputMode: isListening ? 'voice' : 'text',
      subjectId,
      classSlug: topicContext.classSlug,
      classLabel: topicContext.classLabel,
      documentId: topicContext.documentId,
      documentTitle: topicContext.documentTitle,
      chapterId: topicContext.chapterId,
      chapterLabel: topicContext.chapterLabel,
      topicId,
      topicLabel,
      subjectLabel,
      topicPath: topicContext.topicPath,
      topicLevel: topicContext.topicLevel,
      topicPageNumber: topicContext.topicPageNumber,
      status: 'pending-analysis',
      syncStatus: 'pending',
    }

    try {
      const responseId = await saveResponse(answer)
      notifyOfflineSyncStateChanged()
      navigate('/analysis', {
        state: {
          responseId,
          answer,
          topicContext,
          topicId,
          topicLabel,
          subjectLabel,
        },
      })
    } catch {
      setSubmitError('Could not save your answer locally. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container-page max-w-4xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-5 pl-0">
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-surface-muted">
        {topicContext.classLabel && <span className="badge-primary">{topicContext.classLabel}</span>}
        {subjectLabel && <span className="badge-primary">{subjectLabel}</span>}
        {topicContext.chapterLabel && <span className="badge-amber">{topicContext.chapterLabel}</span>}
        <span className="badge-teal">{topicLabel}</span>
      </div>

      {topicContext.documentTitle && (
        <div className="mb-6 rounded-xl border border-surface-border bg-surface/40 px-4 py-3 text-sm text-surface-muted">
          Source textbook: <span className="font-semibold text-surface-text">{topicContext.documentTitle}</span>
        </div>
      )}

      {isLoadingQuestion && (
        <article className="card mb-6 overflow-hidden">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="skeleton h-7 w-16" />
            <div className="skeleton h-6 w-6 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-5/6" />
          </div>
        </article>
      )}

      {questionError && (
        <div className="mb-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          {questionError}
        </div>
      )}

      {question && (
      <article className="card mb-6 overflow-hidden">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="badge-primary">Q1</span>
            <span className="flex items-center gap-1 text-xs text-surface-muted">
              <ClockIcon className="h-3.5 w-3.5" />
              {question.estimatedTime}
            </span>
          </div>
          <SparklesIcon className="h-5 w-5 text-primary-500" />
        </div>

        <h1 className="mb-8 text-2xl font-display font-bold leading-snug text-surface-text sm:text-3xl">
          {question.text}
        </h1>

        <div className="rounded-2xl border border-surface-border bg-surface/40 p-4">
          <label htmlFor="student-answer" className="mb-3 block text-sm font-semibold text-surface-text">
            {t(language, 'ui', 'enter_answer')}
          </label>
          <textarea
            id="student-answer"
            value={answerText + (interimText ? (answerText ? ' ' : '') + interimText : '')}
            onChange={(event) => {
              setAnswerText(event.target.value)
              setInterimText('')
            }}
            rows={7}
            className="input min-h-44 resize-none text-base leading-relaxed"
            placeholder="Type your thinking here..."
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              id="voice-answer-btn"
              type="button"
              onClick={toggleListening}
              className={`btn-secondary px-4 ${isListening ? 'border-accent-rose/60 text-accent-rose' : ''}`}
              aria-pressed={isListening}
            >
              <MicrophoneIcon className="h-4 w-4" />
              {isListening ? 'Listening...' : t(language, 'ui', 'speak')}
            </button>

            <span className="text-xs text-surface-muted">
              {answerText.trim().length} characters
            </span>
          </div>
        </div>
      </article>
      )}

      <div className="mb-6">
        <button
          id="show-hint-btn"
          type="button"
          disabled={!question}
          onClick={() => setShowHint((value) => !value)}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-amber hover:underline"
        >
          <LightBulbIcon className="h-4 w-4" />
          {showHint ? 'Hide hint' : 'Hint'}
        </button>
        {showHint && question && (
          <div className="mt-3 glass border-accent-amber/20 p-4 text-sm text-accent-amber/90 animate-slide-up">
            {question.hint}
          </div>
        )}
      </div>

      {(voiceError || submitError) && (
        <div className="mb-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
          {voiceError || submitError}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          id="submit-answer-btn"
          type="button"
          onClick={handleSubmit}
          disabled={!answerReady || isSubmitting || !question}
          className="btn-primary"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : t(language, 'ui', 'submit')}
        </button>
      </div>
    </div>
  )
}
