/**
 * AgentPipeline.jsx
 * Extracted from Awaaz, re-themed to PV design system.
 * Renders the multi-agent workflow visualizer with sequential animation.
 * Accepts the spec JSON:
 *   { agent_flow: [{ agent, status, message }], response: "..." }
 *
 * Props:
 *   steps  — array of { agent, status, message } (live-updating)
 *   done   — boolean: pipeline finished
 *   error  — string | null
 */

import { useEffect, useRef } from 'react'
import { CheckCircleIcon, ArrowPathIcon } from '@/components/ui/Icons'

const AGENT_COLORS = {
  'Validation Agent':    { bg: 'bg-primary-500/10',   text: 'text-primary-500',   border: 'border-primary-500/30'   },
  'Structuring Agent':   { bg: 'bg-accent-blue/10',   text: 'text-accent-blue',   border: 'border-accent-blue/30'   },
  'Confidence Agent':    { bg: 'bg-accent-teal/10',   text: 'text-accent-teal',   border: 'border-accent-teal/30'   },
  'Response Agent':      { bg: 'bg-secondary-400/10', text: 'text-secondary-400', border: 'border-secondary-400/30' },
  default:               { bg: 'bg-surface-card',     text: 'text-surface-muted', border: 'border-surface-border'   },
}

function getColors(agentName) {
  return AGENT_COLORS[agentName] || AGENT_COLORS.default
}

function AgentStep({ step, index, isLast }) {
  const colors = getColors(step.agent)
  const isDone    = step.status === 'success' || step.status === 'done'
  const isRunning = step.status === 'running'
  const isError   = step.status === 'error'

  return (
    <div
      className="flex gap-3 animate-fade-in"
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          border ${colors.border} ${colors.bg} transition-all duration-500
          ${isRunning ? 'animate-pulse-slow' : ''}
        `}>
          {isDone && <CheckCircleIcon className={`w-4 h-4 ${colors.text}`} />}
          {isRunning && <ArrowPathIcon className={`w-4 h-4 ${colors.text} animate-spin`} />}
          {isError && <span className="text-accent-rose text-xs font-bold">!</span>}
          {!isDone && !isRunning && !isError && (
            <span className={`text-xs font-bold ${colors.text}`}>{index + 1}</span>
          )}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1 bg-surface-border min-h-[20px]" />}
      </div>

      {/* Card */}
      <div className={`
        flex-1 mb-3 p-3 rounded-xl border ${colors.border} ${colors.bg}
        transition-all duration-300
      `}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${colors.text}`}>{step.agent}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${isDone    ? 'bg-accent-teal/10 text-accent-teal'   : ''}
            ${isRunning ? `${colors.bg} ${colors.text} animate-pulse-slow` : ''}
            ${isError   ? 'bg-accent-rose/10 text-accent-rose'   : ''}
            ${!isDone && !isRunning && !isError ? 'bg-surface-card text-surface-muted' : ''}
          `}>
            {isDone ? 'done' : isRunning ? 'running…' : isError ? 'error' : 'waiting'}
          </span>
        </div>
        {step.message && (
          <p className="text-xs text-surface-muted leading-relaxed">{step.message}</p>
        )}
      </div>
    </div>
  )
}

export default function AgentPipeline({ steps = [], done = false, error = null }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [steps])

  if (!steps.length && !error) return null

  return (
    <div className="card p-4 my-2 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-border">
        <div className={`
          w-2 h-2 rounded-full flex-shrink-0
          ${done ? 'bg-accent-teal' : 'bg-primary-500 animate-pulse-slow'}
        `} />
        <span className="text-sm font-semibold text-surface-text">
          {done ? 'Analysis complete' : 'Processing…'}
        </span>
        {!done && (
          <ArrowPathIcon className="w-3.5 h-3.5 text-surface-muted animate-spin ml-auto" />
        )}
      </div>

      {/* Agent steps */}
      <div>
        {steps.map((step, i) => (
          <AgentStep key={`${step.agent}-${i}`} step={step} index={i} isLast={i === steps.length - 1} />
        ))}
      </div>

      {error && (
        <div className="mt-2 p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30">
          <p className="text-xs text-accent-rose">{error}</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
