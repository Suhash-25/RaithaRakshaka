import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RefreshCw, RotateCcw, SlidersHorizontal } from 'lucide-react'

const PARTICLE_COUNT = 460
const FIELD_PARTICLE_COUNT = 520
const TWO_PI = Math.PI * 2

const STAGES = {
  attraction: [
    'Iron dust starts scattered across the tray.',
    'The magnet approaches and nearby particles respond first.',
    'Particles accelerate toward the stronger field near the poles.',
    'Dust collects and clings around the north and south poles.',
  ],
  field: [
    'Iron dust is spread evenly on paper above the hidden magnet.',
    'The magnet underneath magnetizes nearby dust grains.',
    'Grains rotate and slide into curved field-line patterns.',
    'Dense lines near the poles reveal the strongest field regions.',
  ],
}

export default function MagneticFieldLab({ className = '' }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const particlesRef = useRef([])
  const targetsRef = useRef([])
  const lastTimeRef = useRef(0)
  const progressRef = useRef(0)

  const [experiment, setExperiment] = useState('attraction')
  const [viewMode, setViewMode] = useState('top')
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  const stageIndex = Math.min(3, Math.floor(progress * 4))
  const stageText = STAGES[experiment][stageIndex]

  const experimentLabel = useMemo(
    () => experiment === 'attraction' ? 'Dust attraction' : 'Field line formation',
    [experiment],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * ratio))
      canvas.height = Math.max(1, Math.floor(rect.height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      resetParticles(canvas, experiment, particlesRef, targetsRef)
      progressRef.current = 0
      setProgress(0)
    }

    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [experiment, resetKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined

    function tick(time) {
      const previousTime = lastTimeRef.current || time
      const deltaSeconds = Math.min(0.04, (time - previousTime) / 1000)
      lastTimeRef.current = time

      if (isPlaying) {
        const duration = experiment === 'attraction' ? 8.5 : 9.5
        progressRef.current = Math.min(1, progressRef.current + (deltaSeconds * speed) / duration)
        stepParticles({
          canvas,
          particles: particlesRef.current,
          targets: targetsRef.current,
          experiment,
          progress: easeInOut(progressRef.current),
          deltaSeconds,
        })
        setProgress(progressRef.current)
      }

      drawScene({
        canvas,
        context,
        particles: particlesRef.current,
        targets: targetsRef.current,
        experiment,
        progress: easeInOut(progressRef.current),
        viewMode,
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      lastTimeRef.current = 0
    }
  }, [experiment, isPlaying, speed, viewMode])

  function handleReset() {
    progressRef.current = 0
    setProgress(0)
    setIsPlaying(true)
    setResetKey((value) => value + 1)
  }

  function handleReplay() {
    progressRef.current = 0
    setProgress(0)
    resetParticles(canvasRef.current, experiment, particlesRef, targetsRef)
    setIsPlaying(true)
  }

  function handleExperimentChange(nextExperiment) {
    setExperiment(nextExperiment)
    setIsPlaying(true)
  }

  return (
    <section className={`overflow-hidden rounded-2xl border border-surface-border bg-surface-card/70 ${className}`}>
      <div className="flex flex-col gap-4 border-b border-surface-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-xs font-semibold text-accent-amber">
            Interactive physics lab
          </div>
          <h2 className="text-2xl font-semibold text-surface-text">Magnetic behaviour with iron dust</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-surface-muted">
            Watch iron dust move under a bar magnet. The simulation uses stronger attraction near the poles and slower movement farther away.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SegmentButton active={experiment === 'attraction'} onClick={() => handleExperimentChange('attraction')}>
            Attraction
          </SegmentButton>
          <SegmentButton active={experiment === 'field'} onClick={() => handleExperimentChange('field')}>
            Field lines
          </SegmentButton>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_290px]">
        <div className="relative aspect-video w-full bg-[#f8faf7] md:aspect-[21/9] md:min-h-[430px]">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none object-contain"
            aria-label={`${experimentLabel} magnetic particle animation`}
          />

          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm z-10">
            {viewMode === 'top' ? '2D top-down view' : '3D perspective view'}
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-xl border border-slate-300/80 bg-white/90 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
              <span>{stageText}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-500 to-amber-500 transition-[width] duration-150"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <aside className="border-t border-surface-border bg-surface/70 p-4 xl:border-l xl:border-t-0">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-text">
            <SlidersHorizontal size={18} className="text-accent-teal" />
            Controls
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsPlaying((value) => !value)} className="btn-secondary px-4 py-2 text-xs">
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={handleReplay} className="btn-secondary px-4 py-2 text-xs">
              <RotateCcw size={15} />
              Replay
            </button>
            <button type="button" onClick={handleReset} className="btn-secondary col-span-2 px-4 py-2 text-xs">
              <RefreshCw size={15} />
              Reset scattered dust
            </button>
          </div>

          <div className="mt-5">
            <label className="mb-2 flex items-center justify-between text-xs font-semibold text-surface-muted">
              <span>Animation speed</span>
              <span>{speed.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.1"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="w-full accent-teal-400"
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-surface-muted">View mode</p>
            <div className="grid grid-cols-2 gap-2">
              <SegmentButton active={viewMode === 'top'} onClick={() => setViewMode('top')}>
                2D
              </SegmentButton>
              <SegmentButton active={viewMode === 'perspective'} onClick={() => setViewMode('perspective')}>
                3D
              </SegmentButton>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-surface-border bg-surface-card/70 p-3">
            <p className="text-sm font-semibold text-surface-text">What to notice</p>
            <p className="mt-2 text-xs leading-relaxed text-surface-muted">
              Dust near the poles moves first because the magnetic field is strongest there. In the field-line view, grains align into curved paths from north to south.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

function SegmentButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
        active
          ? 'border-accent-teal/50 bg-accent-teal/15 text-accent-teal'
          : 'border-surface-border bg-surface-card text-surface-muted hover:text-surface-text'
      }`}
    >
      {children}
    </button>
  )
}

function resetParticles(canvas, experiment, particlesRef, targetsRef) {
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const width = rect.width || 900
  const height = rect.height || 430

  targetsRef.current = experiment === 'field' ? buildFieldTargets(width, height) : []
  particlesRef.current = experiment === 'field'
    ? createFieldParticles(width, height, targetsRef.current)
    : createAttractionParticles(width, height)
}

function createAttractionParticles(width, height) {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    id: index,
    x: randomBetween(30, width - 30),
    y: randomBetween(height * 0.24, height - 45),
    vx: 0,
    vy: 0,
    radius: (randomBetween(1.15, 2.2) * width) / 800,
    shade: randomBetween(35, 95),
    stuck: false,
    jitter: Math.random() * TWO_PI,
  }))
}

function createFieldParticles(width, height, targets) {
  const scale = width / 800;
  return Array.from({ length: FIELD_PARTICLE_COUNT }, (_, index) => {
    const target = targets[index % targets.length]
    return {
      id: index,
      x: randomBetween(36, width - 36),
      y: randomBetween(54, height - 54),
      vx: 0,
      vy: 0,
      radius: (randomBetween(1.1, 1.9) * scale),
      shade: randomBetween(25, 85),
      target,
      jitter: Math.random() * TWO_PI,
    }
  })
}

function buildFieldTargets(width, height) {
  const centerX = width * 0.5
  const centerY = height * 0.5
  const halfLength = Math.min(width * 0.19, 150)
  const targets = []
  const lineOffsets = [-150, -112, -78, -48, -24, 24, 48, 78, 112, 150]

  lineOffsets.forEach((offset, lineIndex) => {
    const samples = 34 + Math.round(18 * (1 - Math.min(1, Math.abs(offset) / 160)))
    for (let i = 0; i < samples; i += 1) {
      const t = i / Math.max(1, samples - 1)
      const x = centerX - halfLength + t * halfLength * 2
      const arc = Math.sin(t * Math.PI) * offset
      const poleDensity = Math.cos((t - 0.5) * Math.PI) ** 2
      const y = centerY + arc * (0.72 + poleDensity * 0.2)
      targets.push({
        x: x + randomBetween(-2.5, 2.5),
        y: y + randomBetween(-2.5, 2.5),
        angle: Math.atan2(Math.cos(t * Math.PI) * offset, halfLength * 2),
        lineIndex,
      })
    }
  })

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 105; i += 1) {
      const angle = randomBetween(0, TWO_PI)
      const radius = Math.sqrt(Math.random()) * 54
      targets.push({
        x: centerX + side * halfLength + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.8,
        angle,
        lineIndex: side,
      })
    }
  }

  return targets
}

function stepParticles({ canvas, particles, targets, experiment, progress, deltaSeconds }) {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  if (experiment === 'attraction') {
    const magnet = getAttractionMagnet(width, height, progress)
    const poles = getMagnetPoles(magnet)

    particles.forEach((particle) => {
      if (particle.stuck) {
        particle.x += (particle.stuck.x - particle.x) * 0.22
        particle.y += (particle.stuck.y - particle.y) * 0.22
        return
      }

      let fx = 0
      let fy = 0
      poles.forEach((pole) => {
        const dx = pole.x - particle.x
        const dy = pole.y - particle.y
        const distanceSq = Math.max(70, dx * dx + dy * dy)
        const distance = Math.sqrt(distanceSq)
        const fieldStrength = 230000 / distanceSq
        const activation = Math.max(0, progress - distance / Math.max(width, height) * 0.8)
        fx += (dx / distance) * fieldStrength * (0.15 + activation * 1.8)
        fy += (dy / distance) * fieldStrength * (0.15 + activation * 1.8)

        if (distance < 20 && progress > 0.72) {
          particle.stuck = {
            x: pole.x + randomBetween(-12, 12),
            y: pole.y + randomBetween(-18, 18),
          }
        }
      })

      particle.vx = (particle.vx + fx * deltaSeconds) * 0.9
      particle.vy = (particle.vy + fy * deltaSeconds) * 0.9
      particle.x += particle.vx * deltaSeconds * 36
      particle.y += particle.vy * deltaSeconds * 36
      particle.x = clamp(particle.x, 18, width - 18)
      particle.y = clamp(particle.y, height * 0.16, height - 20)
    })
    return
  }

  particles.forEach((particle, index) => {
    const target = particle.target ?? targets[index % targets.length]
    const attraction = 0.8 + progress * 7
    const dx = target.x - particle.x
    const dy = target.y - particle.y
    particle.vx = (particle.vx + dx * attraction * deltaSeconds) * 0.82
    particle.vy = (particle.vy + dy * attraction * deltaSeconds) * 0.82
    particle.x += particle.vx * deltaSeconds * 20
    particle.y += particle.vy * deltaSeconds * 20
  })
}

function drawScene({ canvas, context, particles, targets, experiment, progress, viewMode }) {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  context.clearRect(0, 0, width, height)

  drawPaper(context, width, height, viewMode)

  if (experiment === 'field') {
    drawFieldGuideLines(context, targets, progress)
    drawHiddenMagnet(context, width, height, viewMode)
  }

  if (experiment === 'attraction') {
    const magnet = getAttractionMagnet(width, height, progress)
    drawAttractionFieldHints(context, magnet, progress)
    drawParticles(context, particles, progress, viewMode)
    drawMagnet(context, magnet, false)
    return
  }

  drawParticles(context, particles, progress, viewMode, true)
}

function drawPaper(context, width, height, viewMode) {
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#fffdf4')
  gradient.addColorStop(1, '#e8f1eb')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.save()
  if (viewMode === 'perspective') {
    context.translate(width * 0.5, height * 0.5)
    context.scale(1, 0.82)
    context.translate(-width * 0.5, -height * 0.5)
  }
  context.strokeStyle = 'rgba(30, 41, 59, 0.08)'
  context.lineWidth = 1
  for (let x = 0; x < width; x += 34) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
  }
  for (let y = 0; y < height; y += 34) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }
  context.restore()
}

function drawParticles(context, particles, progress, viewMode, elongated = false) {
  context.save()
  if (viewMode === 'perspective') {
    const canvas = context.canvas
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    context.translate(width * 0.5, height * 0.5)
    context.scale(1, 0.82)
    context.translate(-width * 0.5, -height * 0.5)
  }

  particles.forEach((particle) => {
    const alpha = 0.62 + progress * 0.35
    context.fillStyle = `rgba(${particle.shade}, ${particle.shade}, ${particle.shade - 10}, ${alpha})`
    context.beginPath()
    if (elongated && progress > 0.35) {
      context.ellipse(particle.x, particle.y, particle.radius * 2.2, particle.radius * 0.75, particle.target?.angle ?? 0, 0, TWO_PI)
    } else {
      context.arc(particle.x, particle.y, particle.radius, 0, TWO_PI)
    }
    context.fill()
  })
  context.restore()
}

function drawMagnet(context, magnet, hidden) {
  context.save()
  context.translate(magnet.x, magnet.y)
  context.rotate(magnet.angle)
  context.shadowColor = 'rgba(15, 23, 42, 0.22)'
  context.shadowBlur = 18
  context.shadowOffsetY = 8

  context.fillStyle = hidden ? 'rgba(30, 41, 59, 0.16)' : '#1e293b'
  roundRect(context, -magnet.width / 2, -magnet.height / 2, magnet.width, magnet.height, 12)
  context.fill()

  context.shadowColor = 'transparent'
  context.fillStyle = hidden ? 'rgba(239, 68, 68, 0.34)' : '#dc2626'
  roundRect(context, -magnet.width / 2, -magnet.height / 2, magnet.width / 2, magnet.height, 12)
  context.fill()
  context.fillStyle = hidden ? 'rgba(37, 99, 235, 0.34)' : '#2563eb'
  roundRect(context, 0, -magnet.height / 2, magnet.width / 2, magnet.height, 12)
  context.fill()

  context.fillStyle = hidden ? 'rgba(15, 23, 42, 0.45)' : '#ffffff'
  context.fillStyle = hidden ? 'rgba(15, 23, 42, 0.45)' : '#ffffff'
  const fontSize = Math.max(12, Math.floor(18 * (magnet.width / 270)))
  context.font = `700 ${fontSize}px sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('N', -magnet.width * 0.25, 0)
  context.fillText('S', magnet.width * 0.25, 0)
  context.restore()
}

function drawHiddenMagnet(context, width, height, viewMode) {
  context.save()
  if (viewMode === 'perspective') {
    context.globalAlpha = 0.8
  }
  const magWidth = Math.min(width * 0.38, 300)
  const magHeight = magWidth * 0.22
  drawMagnet(context, {
    x: width * 0.5,
    y: height * 0.5 + (viewMode === 'perspective' ? magHeight * 0.7 : 0),
    width: magWidth,
    height: magHeight,
    angle: 0,
  }, true)
  context.restore()
}

function drawFieldGuideLines(context, targets, progress) {
  if (progress < 0.25) return
  context.save()
  context.globalAlpha = Math.min(0.34, (progress - 0.25) * 0.55)
  context.strokeStyle = '#0f766e'
  context.lineWidth = 1.1
  const grouped = new Map()
  targets.forEach((target) => {
    if (Math.abs(target.lineIndex) === 1) return
    const group = grouped.get(target.lineIndex) ?? []
    group.push(target)
    grouped.set(target.lineIndex, group)
  })
  grouped.forEach((line) => {
    line.sort((left, right) => left.x - right.x)
    context.beginPath()
    line.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y)
      else context.lineTo(point.x, point.y)
    })
    context.stroke()
  })
  context.restore()
}

function drawAttractionFieldHints(context, magnet, progress) {
  if (progress < 0.18) return
  const poles = getMagnetPoles(magnet)
  context.save()
  context.globalAlpha = Math.min(0.35, progress * 0.5)
  context.strokeStyle = '#0f766e'
  context.lineWidth = 1.3
  for (let i = 0; i < 8; i += 1) {
    const spread = (i - 3.5) * 18
    context.beginPath()
    context.moveTo(poles[0].x, poles[0].y + spread * 0.2)
    context.quadraticCurveTo(magnet.x, magnet.y + spread * 2.4, poles[1].x, poles[1].y - spread * 0.2)
    context.stroke()
  }
  context.restore()
}

function getAttractionMagnet(width, height, progress) {
  const magWidth = Math.min(width * 0.36, 270)
  const magHeight = magWidth * 0.22
  return {
    x: width * 0.5,
    y: -magHeight + progress * (height * 0.5 + magHeight + 22),
    width: magWidth,
    height: magHeight,
    angle: 0,
  }
}

function getMagnetPoles(magnet) {
  const cos = Math.cos(magnet.angle)
  const sin = Math.sin(magnet.angle)
  const left = -magnet.width * 0.25
  const right = magnet.width * 0.25
  return [
    { x: magnet.x + left * cos, y: magnet.y + left * sin, type: 'N' },
    { x: magnet.x + right * cos, y: magnet.y + right * sin, type: 'S' },
  ]
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function easeInOut(value) {
  return value < 0.5
    ? 2 * value * value
    : 1 - ((-2 * value + 2) ** 2) / 2
}
