import { useEffect, useRef } from 'react'

export type HeartWaveSettings = {
  rippleLifetime: number
  rippleRadiusFactor: number
  baseScaleMinPx: number
  radiusProgressExponent: number
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
  phaseOffset: number
}

const MAX_RIPPLES = 240
const MIN_TAP_INTERVAL = 120 // ms
const HEART_COLORS = [332, 8, 348, 358]
const HARMONIC_COUNT = 10

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const DEFAULT_HEART_WAVE_SETTINGS: HeartWaveSettings = {
  rippleLifetime: 1700,
  rippleRadiusFactor: 1,
  baseScaleMinPx: 42,
  radiusProgressExponent: 1.35,
  ringThicknessRatio: 0.12,
  minRingThicknessPx: 6,
  glowThicknessRatio: 0.01,
  minGlowThicknessPx: 20,
  highlightRatio: 0.32,
  alphaStart: 0.62,
  alphaFalloff: 0.52,
}

const getRippleRadius = (
  age: number,
  width: number,
  height: number,
  settings: HeartWaveSettings
) => {
  const linear = clamp01(age / settings.rippleLifetime)
  const exponent = Math.max(0.1, settings.radiusProgressExponent)
  const easedRadiusProgress =
    exponent === 1
      ? linear
      : exponent > 1
        ? Math.pow(linear, exponent)
        : 1 - Math.pow(1 - linear, exponent)

  const reach = Math.hypot(width, height) * 0.5 * settings.rippleRadiusFactor
  return reach * easedRadiusProgress
}

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

  const fade = Math.pow(1 - progress, 1.18)
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

  if (wakeIntensity > 0.02) {
    const wakeScale = 1 + wakeIntensity * 0.12
    ctx.globalAlpha = alpha * 0.28 * wakeIntensity
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
    const currentSettings = settingsRef.current

    const now = performance.now()
    const spacing = Math.max(
      40,
      currentSettings.rippleLifetime / (HARMONIC_COUNT + 1)
    )
    const newRipples: Ripple[] = []

    for (let index = 0; index < HARMONIC_COUNT; index += 1) {
      idRef.current += 1
      newRipples.push({
        id: idRef.current,
        x,
        y,
        createdAt: now,
        hue: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        phaseOffset: index * spacing,
      })
    }

    ripplesRef.current = [...ripplesRef.current, ...newRipples].slice(-MAX_RIPPLES)

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
        const effectiveAge = age - ripple.phaseOffset
        if (effectiveAge < 0) continue
        if (effectiveAge > currentSettings.rippleLifetime + 50) {
          ripples.splice(i, 1)
          continue
        }

        const progress = clamp01(effectiveAge / currentSettings.rippleLifetime)
        const radius = getRippleRadius(effectiveAge, w, h, currentSettings)
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
