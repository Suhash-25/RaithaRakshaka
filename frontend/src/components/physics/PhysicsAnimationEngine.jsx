import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * PhysicsAnimationEngine — Reusable Canvas animation framework.
 *
 * Each animation module provides: { init, step, draw, stages, controls? }
 * This engine handles: canvas setup, resize, animation loop, play/pause/speed,
 * stage-based narration, and the control panel UI.
 */

/* ── Hook: usePhysicsCanvas ─────────────────────────── */
export function usePhysicsCanvas({ canvasRef, animation, width, height }) {
  const stateRef = useRef(null)
  const rafRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [stageIndex, setStageIndex] = useState(0)
  const [tick, setTick] = useState(0)

  // Init
  useEffect(() => {
    if (!animation) return
    stateRef.current = animation.init?.(width, height) ?? {}
    stateRef.current._tick = 0
    stateRef.current._stageIndex = 0
    setStageIndex(0)
    setTick(0)
    setPlaying(true)
  }, [animation, width, height])

  // Loop
  useEffect(() => {
    if (!animation || !canvasRef.current) return undefined
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return undefined

    let lastTime = performance.now()

    function frame(now) {
      if (!stateRef.current) return
      const dt = Math.min((now - lastTime) / 1000, 0.05) * speed
      lastTime = now

      if (playing) {
        animation.step?.(stateRef.current, dt, width, height)
        stateRef.current._tick = (stateRef.current._tick ?? 0) + dt
        setTick(stateRef.current._tick)

        // Auto-advance stages based on tick
        const stages = animation.stages ?? []
        const idx = stateRef.current._stageIndex ?? 0
        if (idx < stages.length - 1 && stages[idx].duration) {
          const elapsed = stateRef.current._stageStart
            ? stateRef.current._tick - stateRef.current._stageStart
            : stateRef.current._tick
          if (elapsed >= stages[idx].duration) {
            stateRef.current._stageIndex = idx + 1
            stateRef.current._stageStart = stateRef.current._tick
            setStageIndex(idx + 1)
          }
        }
      }

      // Always draw (even paused, for initial render)
      ctx.clearRect(0, 0, width, height)
      animation.draw?.(ctx, stateRef.current, width, height)
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animation, canvasRef, playing, speed, width, height])

  const replay = useCallback(() => {
    if (!animation) return
    stateRef.current = animation.init?.(width, height) ?? {}
    stateRef.current._tick = 0
    stateRef.current._stageIndex = 0
    stateRef.current._stageStart = 0
    setStageIndex(0)
    setTick(0)
    setPlaying(true)
  }, [animation, width, height])

  const goToStage = useCallback((idx) => {
    if (!stateRef.current) return
    stateRef.current._stageIndex = idx
    stateRef.current._stageStart = stateRef.current._tick
    setStageIndex(idx)
  }, [])

  return { playing, setPlaying, speed, setSpeed, stageIndex, goToStage, replay, tick }
}

/* ── Main Component ──────────────────────────────────── */
export default function PhysicsAnimationEngine({ animation, title, className = '' }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 500 })

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return undefined
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      const w = Math.floor(width)
      const h = Math.floor(Math.min(w * 0.625, 560))
      setDims({ w, h })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // HiDPI canvas
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const dpr = window.devicePixelRatio || 1
    cvs.width = dims.w * dpr
    cvs.height = dims.h * dpr
    cvs.style.width = `${dims.w}px`
    cvs.style.height = `${dims.h}px`
    const ctx = cvs.getContext('2d')
    ctx?.scale(dpr, dpr)
  }, [dims])

  const { playing, setPlaying, speed, setSpeed, stageIndex, goToStage, replay, tick } =
    usePhysicsCanvas({ canvasRef, animation, width: dims.w, height: dims.h })

  const stages = animation?.stages ?? []
  const currentStage = stages[stageIndex]

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-2xl border border-surface-border bg-surface/60 ${className}`}>
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-surface-border bg-surface/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-surface-text">{title ?? 'Physics Animation'}</h3>
        <div className="flex items-center gap-2 text-xs text-surface-muted">
          <span className="rounded-full border border-surface-border bg-surface px-2 py-0.5">
            Stage {stageIndex + 1}/{stages.length || 1}
          </span>
          <span className="rounded-full border border-surface-border bg-surface px-2 py-0.5">
            {speed}×
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full cursor-pointer object-contain"
        style={{ height: dims.h }}
        onClick={() => setPlaying((p) => !p)}
      />

      {/* Stage narration */}
      {currentStage && (
        <div className="border-t border-surface-border bg-surface/80 px-4 py-3">
          <p className="text-sm leading-relaxed text-surface-text">{currentStage.narration}</p>
          {currentStage.detail && (
            <p className="mt-1 text-xs text-surface-muted">{currentStage.detail}</p>
          )}
        </div>
      )}

      {/* Stage progress */}
      {stages.length > 1 && (
        <div className="flex gap-1 px-4 py-2">
          {stages.map((s, i) => (
            <button
              key={s.id ?? i}
              type="button"
              onClick={() => goToStage(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stageIndex ? 'bg-primary-400' : 'bg-surface-border'
              }`}
              aria-label={`Stage ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between border-t border-surface-border bg-surface/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <ControlButton icon={RotateCcw} label="Replay" onClick={replay} />
          <ControlButton
            icon={playing ? Pause : Play}
            label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            active={playing}
          />
        </div>

        <div className="flex items-center gap-2">
          {stageIndex > 0 && (
            <ControlButton icon={ChevronLeft} label="Prev stage" onClick={() => goToStage(stageIndex - 1)} />
          )}
          {stageIndex < stages.length - 1 && (
            <ControlButton icon={ChevronRight} label="Next stage" onClick={() => goToStage(stageIndex + 1)} />
          )}
          <ControlButton icon={SkipForward} label="Speed" onClick={() => setSpeed((s) => (s >= 3 ? 0.5 : s + 0.5))} />
        </div>
      </div>
    </div>
  )
}

function ControlButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        active
          ? 'border-primary-500 bg-primary-500 text-white'
          : 'border-surface-border bg-surface text-surface-muted hover:text-surface-text'
      }`}
    >
      <Icon size={16} />
    </button>
  )
}
