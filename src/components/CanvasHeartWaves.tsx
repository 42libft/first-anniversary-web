import { useEffect, useRef } from 'react'

export type HeartWaveSettings = {
  rippleLifetime: number
  rippleRadiusFactor: number
  baseScaleMinPx: number
  ringThicknessRatio: number
  minRingThicknessPx: number
  glowThicknessRatio: number
  minGlowThicknessPx: number
  highlightRatio: number
  alphaStart: number
  alphaFalloff: number
}

export type CanvasHeartWavesProps = {
  disabled?: boolean
  onPulse?: () => void
  settings?: HeartWaveSettings
}

type Ripple = {
  id: number
  x: number
  y: number
  createdAt: number
  hue: number
}

type BloomHeart = {
  id: number
  x: number
  y: number
  scale: number
  life: number
  hue: number
  rotation: number
}

const MAX_RIPPLES = 14
const MAX_HEARTS = 28
const HEART_LIFETIME = 1500 // ms
const MIN_TAP_INTERVAL = 120 // ms
const HEART_COLORS = [326, 336, 12, 304]

const easeOutCubic = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const DEFAULT_HEART_WAVE_SETTINGS: HeartWaveSettings = {
  rippleLifetime: 3400,
  rippleRadiusFactor: 1.9,
  baseScaleMinPx: 42,
  ringThicknessRatio: 0.12,
  minRingThicknessPx: 22,
  glowThicknessRatio: 0.2,
  minGlowThicknessPx: 42,
  highlightRatio: 0.55,
  alphaStart: 0.82,
  alphaFalloff: 0.6,
}

const getRippleProgress = (age: number, settings: HeartWaveSettings) =>
  easeOutCubic(clamp01(age / settings.rippleLifetime))

const getRippleRadius = (
  age: number,
  width: number,
  height: number,
  settings: HeartWaveSettings
) => Math.min(width, height) * settings.rippleRadiusFactor * getRippleProgress(age, settings)

const drawNormalizedHeartPath = (ctx: CanvasRenderingContext2D) => {
  ctx.beginPath()
  ctx.moveTo(0, -0.62)
  ctx.bezierCurveTo(-0.82, -1.2, -1.52, -0.08, 0, 1.02)
  ctx.bezierCurveTo(1.52, -0.08, 0.82, -1.2, 0, -0.62)
  ctx.closePath()
}

const drawHeartShape = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  hue: number,
  alpha: number,
  rotation: number
) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  const s = Math.max(0.4, scale)
  ctx.scale(s, s)
  drawNormalizedHeartPath(ctx)
  const fill = `hsla(${hue}, 85%, 76%, ${alpha})`
  ctx.fillStyle = fill
  ctx.shadowColor = `hsla(${hue}, 90%, 82%, ${alpha * 0.55})`
  ctx.shadowBlur = 18
  ctx.fill()
  ctx.lineWidth = 0.1
  ctx.strokeStyle = `hsla(${hue}, 70%, 42%, ${alpha * 0.45})`
  ctx.stroke()
  ctx.restore()
}

const drawRippleHeart = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hue: number,
  progress: number,
  dpr: number,
  settings: HeartWaveSettings
) => {
  if (radius < 12) return

  const baseScale = Math.max(radius, settings.baseScaleMinPx * dpr)
  const ringThicknessPx = Math.max(
    radius * settings.ringThicknessRatio,
    settings.minRingThicknessPx * dpr
  )
  const glowThicknessPx = Math.max(
    radius * settings.glowThicknessRatio,
    settings.minGlowThicknessPx * dpr
  )
  const highlightThicknessPx = ringThicknessPx * settings.highlightRatio
  const alpha = Math.max(0, settings.alphaStart - progress * settings.alphaFalloff)

  if (alpha <= 0.001) return

  const normalizedGlowWidth = (ringThicknessPx * 1.45) / baseScale
  const normalizedRingWidth = ringThicknessPx / baseScale
  const normalizedHighlightWidth = highlightThicknessPx / baseScale
  const normalizedGlowBlur = glowThicknessPx / baseScale
  const normalizedHighlightBlur = (glowThicknessPx * 0.55) / baseScale

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(baseScale, baseScale)
  drawNormalizedHeartPath(ctx)

  ctx.globalAlpha = alpha * 0.55
  ctx.lineWidth = normalizedGlowWidth
  ctx.shadowBlur = normalizedGlowBlur
  ctx.shadowColor = `hsla(${hue}, 88%, 72%, ${alpha * 0.65})`
  ctx.strokeStyle = `hsla(${(hue + 6) % 360}, 84%, 62%, 0.6)`
  ctx.stroke()

  ctx.globalAlpha = alpha * 0.9
  ctx.lineWidth = normalizedRingWidth
  ctx.shadowBlur = normalizedGlowBlur * 0.85
  ctx.shadowColor = `hsla(${(hue + 4) % 360}, 96%, 78%, ${alpha * 0.8})`
  ctx.strokeStyle = `hsla(${hue}, 96%, 90%, 1)`
  ctx.stroke()

  ctx.globalAlpha = alpha * 0.75
  ctx.lineWidth = normalizedHighlightWidth
  ctx.shadowBlur = normalizedHighlightBlur
  ctx.shadowColor = `hsla(${(hue + 32) % 360}, 98%, 96%, ${alpha * 0.75})`
  ctx.strokeStyle = `hsla(${(hue + 28) % 360}, 96%, 98%, 1)`
  ctx.stroke()

  ctx.restore()
}

export const CanvasHeartWaves = ({
  disabled = false,
  onPulse,
  settings,
}: CanvasHeartWavesProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const dprRef = useRef(1)
  const ripplesRef = useRef<Ripple[]>([])
  const heartsRef = useRef<BloomHeart[]>([])
  const idRef = useRef(0)
  const lastTapRef = useRef(0)
  const lastPairEmitRef = useRef<Map<string, number>>(new Map())
  const settingsRef = useRef<HeartWaveSettings>(DEFAULT_HEART_WAVE_SETTINGS)

  useEffect(() => {
    settingsRef.current = settings ?? DEFAULT_HEART_WAVE_SETTINGS
  }, [settings])

  const resize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8)
    dprRef.current = dpr
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
  }

  const spawnRipple = (clientX: number, clientY: number, shouldCount: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = dprRef.current
    const x = (clientX - rect.left) * dpr
    const y = (clientY - rect.top) * dpr

    idRef.current += 1
    const ripple: Ripple = {
      id: idRef.current,
      x,
      y,
      createdAt: performance.now(),
      hue: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    }

    ripplesRef.current = [...ripplesRef.current.slice(-MAX_RIPPLES + 1), ripple]

    if (shouldCount) onPulse?.()
  }

  const spawnHeart = (x: number, y: number, hue: number, radius: number) => {
    idRef.current += 1
    const heart: BloomHeart = {
      id: idRef.current,
      x,
      y,
      scale: Math.max(0.45, Math.min(1.3, radius / 260)),
      life: 0,
      hue,
      rotation: (Math.random() - 0.5) * 0.5,
    }

    heartsRef.current = [...heartsRef.current.slice(-MAX_HEARTS + 1), heart]
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      const now = performance.now()
      const dpr = dprRef.current
      const w = canvas.width
      const h = canvas.height
      const currentSettings = settingsRef.current

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(8, 4, 18, 0.18)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'lighter'

      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const ripple = ripples[i]
        const age = now - ripple.createdAt
        if (age > currentSettings.rippleLifetime) {
          ripples.splice(i, 1)
          continue
        }

        const progress = getRippleProgress(age, currentSettings)
        const radius = getRippleRadius(age, w, h, currentSettings)
        if (radius <= 1) continue
        drawRippleHeart(
          ctx,
          ripple.x,
          ripple.y,
          radius,
          ripple.hue,
          progress,
          dpr,
          currentSettings
        )
      }

      // Detect simple interactions (ripples crossing)
      const pairCache = lastPairEmitRef.current
      for (let a = 0; a < ripples.length; a += 1) {
        for (let b = a + 1; b < ripples.length; b += 1) {
          const r1 = ripples[a]
          const r2 = ripples[b]
          const age1 = now - r1.createdAt
          const age2 = now - r2.createdAt
          if (age1 > currentSettings.rippleLifetime || age2 > currentSettings.rippleLifetime)
            continue
          const radius1 = getRippleRadius(age1, w, h, currentSettings)
          const radius2 = getRippleRadius(age2, w, h, currentSettings)
          const dx = r1.x - r2.x
          const dy = r1.y - r2.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance === 0) continue
          const diff = Math.abs(radius1 - radius2)
          if (diff < dpr * 18 && distance < radius1 + radius2 && distance > Math.abs(radius1 - radius2)) {
            const key = `${r1.id}-${r2.id}`
            const lastAt = pairCache.get(key) ?? 0
            if (now - lastAt < 260) continue
            const nx = r2.x + (dx / distance) * (radius2 / (radius1 + radius2)) * distance
            const ny = r2.y + (dy / distance) * (radius2 / (radius1 + radius2)) * distance
            spawnHeart(nx, ny, (r1.hue + r2.hue) / 2, (radius1 + radius2) / 2)
            pairCache.set(key, now)
          }
        }
      }

      if (pairCache.size) {
        const activeIds = new Set(ripples.map((r) => r.id))
        pairCache.forEach((_, key) => {
          const [idA, idB] = key.split('-').map(Number)
          if (!activeIds.has(idA) || !activeIds.has(idB)) {
            pairCache.delete(key)
          }
        })
      }

      const hearts = heartsRef.current
      for (let i = hearts.length - 1; i >= 0; i -= 1) {
        const heart = hearts[i]
        heart.life += 16
        if (heart.life > HEART_LIFETIME) {
          hearts.splice(i, 1)
          continue
        }
        const progress = heart.life / HEART_LIFETIME
        const alpha = Math.max(0, 0.9 - progress * 1.2)
        const floatingY = heart.y - dpr * 24 * progress
        drawHeartShape(ctx, heart.x, floatingY, heart.scale, heart.hue, alpha, heart.rotation)
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => {
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(() => resize())
    if (canvasRef.current) observer.observe(canvasRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const node = canvasRef.current
    if (!node) return

    const handlePointerDown = (event: PointerEvent) => {
      if (disabled) return
      const now = performance.now()
      if (now - lastTapRef.current < MIN_TAP_INTERVAL) return
      lastTapRef.current = now
      spawnRipple(event.clientX, event.clientY, true)
    }

    node.addEventListener('pointerdown', handlePointerDown)
    return () => {
      node.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [disabled])

  useEffect(() => {
    if (disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    const autoPulse = () => {
      const x = rect.left + rect.width * (0.25 + Math.random() * 0.5)
      const y = rect.top + rect.height * (0.3 + Math.random() * 0.4)
      spawnRipple(x, y, false)
    }

    const initial = setTimeout(autoPulse, 320)
    const interval = setInterval(() => {
      if (!disabled) autoPulse()
    }, 3600)

    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [disabled])

  return (
    <canvas
      ref={canvasRef}
      className="canvas-love"
      role="img"
      aria-label="タップすると波紋が広がり、ハートが共鳴して浮かび上がる"
    />
  )
}
