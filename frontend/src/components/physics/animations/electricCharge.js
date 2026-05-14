/**
 * Electric Charge Animation — Ch1 T1
 * Shows electron transfer between glass rod and silk when rubbed.
 */

const COLORS = {
  rod: '#6495ED',
  silk: '#FF69B4',
  electron: '#00BFFF',
  proton: '#FF4444',
  bg: '#0d1117',
  text: '#e6edf3',
  muted: '#8b949e',
  glow: 'rgba(0, 191, 255, 0.3)',
}

export const electricCharge = {
  stages: [
    { id: 'neutral', narration: 'Both the glass rod and silk cloth start electrically neutral — equal numbers of positive and negative charges.', detail: 'Each atom has protons (+) in the nucleus and electrons (−) orbiting it.', duration: 5 },
    { id: 'rubbing', narration: 'When the rod is rubbed with silk, friction allows electrons to transfer from the rod to the silk.', detail: 'Silk holds electrons more tightly than glass due to its higher electron affinity.', duration: 8 },
    { id: 'charged', narration: 'After rubbing, the glass rod has lost electrons (net positive) and the silk has gained electrons (net negative).', detail: 'Total charge is conserved — no charge was created or destroyed.' },
  ],

  init(w, h) {
    const particles = []
    const rodX = w * 0.3, rodY = h * 0.5, silkX = w * 0.7, silkY = h * 0.5
    // Create electrons and protons for rod
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const r = 30 + Math.random() * 20
      particles.push({
        x: rodX + Math.cos(angle) * r,
        y: rodY + Math.sin(angle) * r,
        type: 'electron', owner: 'rod', transferring: false,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
        baseX: rodX, baseY: rodY, targetX: 0, targetY: 0,
      })
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const r = 15 + Math.random() * 10
      particles.push({
        x: rodX + Math.cos(angle) * r,
        y: rodY + Math.sin(angle) * r,
        type: 'proton', owner: 'rod', transferring: false,
        vx: 0, vy: 0, baseX: rodX, baseY: rodY,
      })
    }
    // Electrons and protons for silk
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const r = 30 + Math.random() * 20
      particles.push({
        x: silkX + Math.cos(angle) * r,
        y: silkY + Math.sin(angle) * r,
        type: 'electron', owner: 'silk', transferring: false,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
        baseX: silkX, baseY: silkY,
      })
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const r = 15 + Math.random() * 10
      particles.push({
        x: silkX + Math.cos(angle) * r,
        y: silkY + Math.sin(angle) * r,
        type: 'proton', owner: 'silk', transferring: false,
        vx: 0, vy: 0, baseX: silkX, baseY: silkY,
      })
    }

    return {
      particles, rodX, rodY, silkX, silkY,
      transferCount: 0, maxTransfer: 4, rubPhase: 0,
    }
  },

  step(state, dt, w, h) {
    const stage = state._stageIndex ?? 0
    state.rubPhase = (state.rubPhase ?? 0) + dt * 3

    const rodX = w * 0.3, silkX = w * 0.7
    const cy = h * 0.5

    // During rubbing stage, animate transfer
    if (stage === 1 && state.transferCount < state.maxTransfer) {
      const elapsed = (state._tick ?? 0) - (state._stageStart ?? 0)
      const needed = Math.floor(elapsed / 1.5)
      while (state.transferCount < needed && state.transferCount < state.maxTransfer) {
        // Find a rod electron that hasn't transferred
        const available = state.particles.find(
          p => p.type === 'electron' && p.owner === 'rod' && !p.transferring
        )
        if (available) {
          available.transferring = true
          available.targetX = silkX + (Math.random() - 0.5) * 50
          available.targetY = cy + (Math.random() - 0.5) * 50
          state.transferCount++
        }
      }
    }

    // Move particles
    for (const p of state.particles) {
      if (p.transferring) {
        // Animate toward silk
        p.x += (p.targetX - p.x) * dt * 2
        p.y += (p.targetY - p.y) * dt * 2
        if (Math.abs(p.x - p.targetX) < 2 && Math.abs(p.y - p.targetY) < 2) {
          p.owner = 'silk'
          p.transferring = false
          p.baseX = silkX
          p.baseY = cy
        }
      } else if (p.type === 'electron') {
        // Orbit around base
        p.x += p.vx * dt
        p.y += p.vy * dt
        const dx = p.baseX - p.x, dy = p.baseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 50) {
          p.vx += dx * dt * 2
          p.vy += dy * dt * 2
        }
        p.vx *= 0.99
        p.vy *= 0.99
      }
    }
  },

  draw(ctx, state, w, h) {
    const { particles, rodX = w * 0.3, silkX = w * 0.7 } = state
    const cy = h * 0.5
    const stage = state._stageIndex ?? 0

    // Background
    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, w, h)

    // Draw glass rod
    const rodW = 120, rodH = 180
    ctx.save()
    ctx.fillStyle = 'rgba(100, 149, 237, 0.15)'
    ctx.strokeStyle = COLORS.rod
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(rodX - rodW / 2, cy - rodH / 2, rodW, rodH, 16)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Glass Rod', rodX, cy - rodH / 2 - 12)

    // Charge label for rod
    const rodElectrons = particles.filter(p => p.type === 'electron' && p.owner === 'rod' && !p.transferring).length
    const rodProtons = particles.filter(p => p.type === 'proton' && p.owner === 'rod').length
    const rodCharge = rodProtons - rodElectrons
    if (stage >= 2) {
      ctx.fillStyle = rodCharge > 0 ? '#FF6B6B' : rodCharge < 0 ? '#00BFFF' : COLORS.muted
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.fillText(rodCharge > 0 ? `+${rodCharge}` : `${rodCharge}`, rodX, cy + rodH / 2 + 24)
    }
    ctx.restore()

    // Draw silk
    ctx.save()
    ctx.fillStyle = 'rgba(255, 105, 180, 0.12)'
    ctx.strokeStyle = COLORS.silk
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(silkX - rodW / 2, cy - rodH / 2, rodW, rodH, 16)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Silk Cloth', silkX, cy - rodH / 2 - 12)

    const silkElectrons = particles.filter(p => p.type === 'electron' && (p.owner === 'silk' || (p.owner === 'rod' && p.transferring))).length + particles.filter(p => p.type === 'electron' && p.owner === 'silk').length
    const silkProtons = particles.filter(p => p.type === 'proton' && p.owner === 'silk').length
    const actualSilkE = particles.filter(p => p.type === 'electron' && p.owner === 'silk' && !p.transferring).length
    const silkCharge = silkProtons - actualSilkE
    if (stage >= 2) {
      ctx.fillStyle = silkCharge > 0 ? '#FF6B6B' : silkCharge < 0 ? '#00BFFF' : COLORS.muted
      ctx.font = 'bold 16px Inter, sans-serif'
      ctx.fillText(silkCharge > 0 ? `+${silkCharge}` : `${silkCharge}`, silkX, cy + rodH / 2 + 24)
    }
    ctx.restore()

    // Rubbing arrows in stage 1
    if (stage === 1) {
      const arrowY = cy + Math.sin(state.rubPhase) * 20
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(rodX + 60, arrowY - 15)
      ctx.lineTo(silkX - 60, arrowY - 15)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(silkX - 60, arrowY + 15)
      ctx.lineTo(rodX + 60, arrowY + 15)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('RUBBING', (rodX + silkX) / 2, arrowY - 25)
      ctx.restore()
    }

    // Draw particles
    for (const p of particles) {
      if (p.type === 'electron') {
        ctx.save()
        // Glow
        ctx.shadowColor = COLORS.electron
        ctx.shadowBlur = p.transferring ? 12 : 6
        ctx.fillStyle = COLORS.electron
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.fill()
        // Minus sign
        ctx.shadowBlur = 0
        ctx.fillStyle = '#000'
        ctx.font = 'bold 7px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('−', p.x, p.y + 0.5)
        ctx.restore()
      } else {
        ctx.save()
        ctx.shadowColor = COLORS.proton
        ctx.shadowBlur = 4
        ctx.fillStyle = COLORS.proton
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 6px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('+', p.x, p.y + 0.5)
        ctx.restore()
      }
    }

    // Conservation label
    if (stage >= 2) {
      ctx.save()
      ctx.fillStyle = 'rgba(0, 255, 136, 0.8)'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⚡ Total charge conserved: 0', w / 2, h - 20)
      ctx.restore()
    }
  },
}
