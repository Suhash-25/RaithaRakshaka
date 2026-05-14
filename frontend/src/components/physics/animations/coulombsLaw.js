/**
 * Coulomb's Law Animation — Ch1 T2
 * Two charges with force vectors, adjustable distance slider.
 */

const COLORS = { bg: '#0d1117', text: '#e6edf3', muted: '#8b949e', pos: '#FF6B6B', neg: '#00BFFF', force: '#FFD93D', grid: 'rgba(255,255,255,0.04)' }

export const coulombsLaw = {
  stages: [
    { id: 'intro', narration: 'Two point charges q₁ (positive, red) and q₂ (negative, blue) are placed apart. The electrostatic force between them is governed by Coulomb\'s Law.', duration: 5 },
    { id: 'distance', narration: 'F = kq₁q₂/r² — The force is inversely proportional to the SQUARE of the distance. Watch how the force arrows change as charges move.', detail: 'Halving the distance makes the force 4× stronger.', duration: 8 },
    { id: 'compare', narration: 'Opposite charges attract (force arrows point inward). Like charges repel (arrows point outward). The force is always along the line joining the charges.', detail: 'F ∝ 1/r² — this is the inverse square law.' },
  ],

  init(w, h) {
    const scale = w / 800
    return {
      q1: { x: w * 0.3, y: h * 0.45, charge: 2, radius: 22 * scale },
      q2: { x: w * 0.7, y: h * 0.45, charge: -3, radius: 22 * scale },
      distFactor: 1, phase: 0,
    }
  },

  step(state, dt, w, h) {
    state.phase = (state.phase ?? 0) + dt
    const stage = state._stageIndex ?? 0

    // In stage 1, animate distance oscillation
    if (stage === 1) {
      state.distFactor = 0.6 + 0.4 * Math.sin(state.phase * 0.8)
      const cx = w / 2, baseSpread = w * 0.2
      const spread = baseSpread * state.distFactor
      state.q1.x = cx - spread
      state.q2.x = cx + spread
    }
  },

  draw(ctx, state, w, h) {
    const { q1, q2, distFactor = 1 } = state
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

    const dist = Math.sqrt((q2.x - q1.x) ** 2 + (q2.y - q1.y) ** 2)
    const ux = (q2.x - q1.x) / dist
    const uy = (q2.y - q1.y) / dist

    // Force magnitude (visual scaling)
    const baseForce = 8000 * (w / 800)
    const forceMag = Math.min(120 * (w / 800), baseForce / (dist * dist) * Math.abs(q1.charge * q2.charge))
    const attractive = (q1.charge * q2.charge) < 0

    // Force arrows
    ctx.save()
    ctx.strokeStyle = COLORS.force
    ctx.fillStyle = COLORS.force
    ctx.lineWidth = 3
    ctx.shadowColor = COLORS.force
    ctx.shadowBlur = 8

    // Arrow on q1 (pointing toward q2 if attractive, away if repulsive)
    const dir1 = attractive ? 1 : -1
    drawArrow(ctx, q1.x, q1.y, q1.x + ux * forceMag * dir1, q1.y + uy * forceMag * dir1, 10)
    // Arrow on q2 (opposite direction)
    drawArrow(ctx, q2.x, q2.y, q2.x - ux * forceMag * dir1, q2.y - uy * forceMag * dir1, 10)
    ctx.restore()

    // Distance line
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = COLORS.muted
    ctx.font = '12px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`r = ${distFactor.toFixed(2)}×`, (q1.x + q2.x) / 2, q1.y - 35)
    ctx.restore()

    // Draw charges
    drawCharge(ctx, q1.x, q1.y, q1.radius, q1.charge, COLORS.pos)
    drawCharge(ctx, q2.x, q2.y, q2.radius, q2.charge, COLORS.neg)

    // Force label
    ctx.save()
    ctx.fillStyle = COLORS.force
    ctx.font = 'bold 14px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`F ∝ 1/r² → F = ${(1 / (distFactor * distFactor)).toFixed(2)}×`, w / 2, h - 40)
    ctx.restore()

    // Formula
    ctx.save()
    ctx.fillStyle = COLORS.muted
    ctx.font = '12px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('F = k|q₁q₂|/r²', w / 2, h - 20)
    ctx.restore()
  },
}

function drawCharge(ctx, x, y, r, charge, color) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
  grad.addColorStop(0, color)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()

  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(charge > 0 ? `+${charge}μC` : `${charge}μC`, x, y)
  ctx.restore()
}

function drawArrow(ctx, x1, y1, x2, y2, headLen) {
  const dx = x2 - x1, dy = y2 - y1
  const angle = Math.atan2(dy, dx)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()
}
