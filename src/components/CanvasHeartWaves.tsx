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

const MAX_RIPPLES = 14
const MIN_TAP_INTERVAL = 120 // ms
const HEART_COLORS = [326, 336, 12, 304]

const easeOutCubic = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const DEFAULT_HEART_WAVE_SETTINGS: HeartWaveSettings = {
  rippleLifetime: 1700,
  rippleRadiusFactor: 0.2,
  baseScaleMinPx: 42,
  ringThicknessRatio: 0.12,
  minRingThicknessPx: 6,
  glowThicknessRatio: 0.01,
  minGlowThicknessPx: 20,
  highlightRatio: 0.32,
  alphaStart: 0.62,
  alphaFalloff: 0.52,
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

  const fade = Math.pow(1 - progress, 1.25)
  const alpha = Math.max(0, settings.alphaStart * fade - progress * settings.alphaFalloff)
  const crestShift = clamp01(progress * 1.12)
  const wakeIntensity = clamp01((progress - 0.32) / 0.55)

  if (alpha <= 0.001) return

  const normalizedGlowWidth = (ringThicknessPx * (1.8 + wakeIntensity)) / baseScale
  const normalizedRingWidth = ringThicknessPx / baseScale
  const normalizedHighlightWidth = highlightThicknessPx / baseScale
  const normalizedGlowBlur = glowThicknessPx * (1.4 + wakeIntensity * 0.6) / baseScale
  const normalizedHighlightBlur = (glowThicknessPx * 0.55) / baseScale

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(baseScale, baseScale)
  drawNormalizedHeartPath(ctx)

  ctx.globalAlpha = alpha * 0.36
  ctx.lineWidth = normalizedGlowWidth
  ctx.shadowBlur = normalizedGlowBlur
  ctx.shadowColor = `hsla(${hue}, 64%, 64%, ${alpha * 0.55})`
  ctx.strokeStyle = `hsla(${(hue + 8) % 360}, 58%, 58%, ${0.36 + wakeIntensity * 0.2})`
  ctx.stroke()

  ctx.globalAlpha = alpha * 0.78
  ctx.lineWidth = normalizedRingWidth * (0.88 + crestShift * 0.26)
  ctx.shadowBlur = normalizedGlowBlur * (0.42 + wakeIntensity * 0.22)
  ctx.shadowColor = `hsla(${(hue + 2) % 360}, 72%, 76%, ${alpha * 0.58})`
  ctx.strokeStyle = `hsla(${(hue + 6) % 360}, 68%, ${66 + wakeIntensity * 6}%, 0.85)`
  ctx.stroke()

  ctx.globalAlpha = alpha * 0.54
  ctx.lineWidth = normalizedHighlightWidth
  ctx.shadowBlur = normalizedHighlightBlur
  ctx.shadowColor = `hsla(${(hue + 18) % 360}, 84%, 86%, ${alpha * 0.48})`
  ctx.strokeStyle = `hsla(${(hue + 16) % 360}, 82%, 92%, 0.82)`
  ctx.stroke()

  ctx.globalAlpha = alpha * (0.12 + wakeIntensity * 0.12)
  ctx.shadowBlur = normalizedHighlightBlur * 0.2
  ctx.fillStyle = `hsla(${(hue + 10) % 360}, 70%, ${72 + wakeIntensity * 8}%, 0.6)`
  ctx.fill()

  if (wakeIntensity > 0.02) {
    const wakeScale = 1 + wakeIntensity * 0.12
    ctx.globalAlpha = alpha * 0.28 * wakeIntensity
    ctx.shadowBlur = normalizedGlowBlur * 0.4
    ctx.lineWidth = normalizedRingWidth * 0.65
    ctx.save()
    ctx.scale(wakeScale, wakeScale)
    ctx.strokeStyle = `hsla(${(hue + 14) % 360}, 58%, 70%, 0.65)`
    ctx.stroke()
    ctx.restore()
  }

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
  const idRef = useRef(0)
  const lastTapRef = useRef(0)
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
