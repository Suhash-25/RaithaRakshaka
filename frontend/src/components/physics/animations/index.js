/**
 * Animation Registry — maps animationType strings to animation modules.
 * Each module exports { init, step, draw, stages }.
 */
import { electricCharge } from './electricCharge'
import { coulombsLaw } from './coulombsLaw'

// Placeholder animation for topics without a dedicated animation yet
const placeholder = {
  stages: [
    { id: 'intro', narration: 'This animation is being developed. A visual demonstration of the concept will appear here soon.', duration: 4 },
    { id: 'concept', narration: 'In the meantime, proceed to the questions below to test your understanding of this topic.' },
  ],
  init(w, h) {
    return { phase: 0, dots: Array.from({ length: 30 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
      r: 2 + Math.random() * 4, hue: Math.random() * 360,
    })) }
  },
  step(state, dt, w, h) {
    state.phase = (state.phase ?? 0) + dt
    for (const d of state.dots) {
      d.x += d.vx * dt; d.y += d.vy * dt
      if (d.x < 0 || d.x > w) d.vx *= -1
      if (d.y < 0 || d.y > h) d.vy *= -1
      d.hue = (d.hue + dt * 20) % 360
    }
  },
  draw(ctx, state, w, h) {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, w, h)
    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    // Animated dots
    for (const d of state.dots) {
      ctx.save()
      ctx.fillStyle = `hsla(${d.hue}, 70%, 60%, 0.6)`
      ctx.shadowColor = `hsla(${d.hue}, 70%, 60%, 0.4)`
      ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
    // Center text
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '16px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🔬 Animation in development', w / 2, h / 2 - 10)
    ctx.font = '12px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText('Proceed to questions below', w / 2, h / 2 + 15)
    ctx.restore()
  },
}

export const ANIMATION_REGISTRY = {
  electricCharge,
  coulombsLaw,
  // Ch1 remaining
  electricFieldLines: placeholder,
  electricDipole: placeholder,
  gaussLaw: placeholder,
  // Ch2
  electricPotential: placeholder,
  capacitor: placeholder,
  // Ch3
  ohmCircuit: placeholder,
  kirchhoff: placeholder,
  wheatstone: placeholder,
  // Ch4
  biotsavart: placeholder,
  // Ch5 — uses existing MagneticFieldLab, but can also fall back
  magneticFieldLab: placeholder,
  // Ch6
  faradayLaw: placeholder,
  // Ch7
  acCircuit: placeholder,
  // Ch8
  emWave: placeholder,
  // Ch9
  rayOptics: placeholder,
  // Ch10
  waveOptics: placeholder,
  // Ch11
  photoelectric: placeholder,
  // Ch12
  atomModel: placeholder,
  // Ch13
  nuclearPhysics: placeholder,
  // Ch14
  semiconductor: placeholder,
}

export function getAnimation(animationType) {
  return ANIMATION_REGISTRY[animationType] ?? placeholder
}
