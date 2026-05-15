import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronRightIcon, ClockIcon, SparklesIcon } from '@/components/ui/Icons'
import { getSubject, TOPICS_BY_SUBJECT } from '@/data/learningCatalog'
import { useLearningSelection } from '@/context/LearningSelectionContext'

const LEVEL_STYLE = {
  Start: 'badge-teal',
  Core: 'badge-primary',
  Deep: 'badge-rose',
}

export default function TopicPage() {
  const { subjectId } = useParams()
  const subject = getSubject(subjectId)
  const topics = TOPICS_BY_SUBJECT[subjectId] ?? []
  const { selection, selectSubject, selectTopic } = useLearningSelection()

  useEffect(() => {
    if (subject && selection.subjectId !== subject.id) {
      selectSubject(subject)
    }
  }, [subject, selection.subjectId, selectSubject])

  if (!subject) {
    return (
      <div className="container-page text-center py-20">
        <p className="text-surface-muted text-lg">Subject not found.</p>
        <Link to="/" className="btn-secondary mt-4">Go Home</Link>
      </div>
    )
  }

  const Icon = subject.Icon

  return (
    <div className="container-page animate-fade-in">
      <header className={`mb-8 overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br ${subject.gradient} p-5 sm:p-7`}>
        <div className="flex items-center justify-between gap-4">
          <Link to="/" id="back-to-home" className="btn-ghost p-2 rounded-xl" aria-label="Back to subjects">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-surface-text/70">
            <span>Subject</span>
            <ChevronRightIcon className="h-3.5 w-3.5" />
            <span className="font-semibold text-surface-text">Topic</span>
            <ChevronRightIcon className="h-3.5 w-3.5" />
            <span>Questions</span>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ${subject.accent}`}>
              <Icon className="h-8 w-8" />
            </div>
            <h1 className="font-display text-4xl font-bold text-surface-text">{subject.label}</h1>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-5xl font-display font-bold text-surface-text/90">{topics.length}</p>
            <p className="text-sm text-surface-text/60">topics</p>
          </div>
        </div>
      </header>

      <section aria-label={`${subject.label} topics`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic, index) => {
          const isActive = selection.topicId === topic.id

          return (
            <Link
              key={topic.id}
              to={`/topic/${topic.id}/question`}
              id={`topic-card-${topic.id}`}
              state={{ subjectId: subject.id, subjectLabel: subject.label, topicLabel: topic.label }}
              onClick={() => selectTopic(subject, topic)}
              className={`card-hover group min-h-40 ${isActive ? 'border-primary-400/70' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${subject.accent}`}>
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <span className={LEVEL_STYLE[topic.level] ?? 'badge-primary'}>{topic.level}</span>
              </div>

              <h2 className="mb-5 text-xl font-display font-bold text-surface-text group-hover:text-gradient">
                {topic.label}
              </h2>

              <div className="flex items-center justify-between text-xs text-surface-muted">
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {topic.time}
                </span>
                <span className="flex items-center gap-1 font-semibold text-primary-500 transition-all group-hover:gap-2">
                  Start
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
