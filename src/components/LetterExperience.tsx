import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export type InteractionStage =
  | 'intro'
  | 'idle'
  | 'aligning'
  | 'tearing'
  | 'primed'
  | 'burst'
  | 'revealed'

interface LetterExperienceProps {
  letterImage?: {
    src: string
    alt?: string
  }
  onStageChange?: (stage: InteractionStage) => void
  onLetterClick?: () => void
  letterActionLabel?: string
}

type TearSpeed = 'idle' | 'slow' | 'fast'

const TEAR_DISTANCE = 280
const AUTO_BURST_THRESHOLD = 0.82
const START_ZONE_X = 0.32
const START_ZONE_Y = 0.36
const START_ZONE_LEEWAY = 0.08
const START_ZONE_EXTRA_TOUCH_X = 0.16
const START_ZONE_EXTRA_TOUCH_Y = 0.12
const START_ZONE_EXTRA_PEN_X = 0.1
const START_ZONE_EXTRA_PEN_Y = 0.08
const START_ZONE_EXTRA_MOUSE_X = 0.05
const START_ZONE_EXTRA_MOUSE_Y = 0.05
const CUTLINE_BAND_EXTENSION = 0.18
const PARTICLE_COUNT = 365
const MIN_HORIZONTAL_MARGIN = 0.018
const MIN_VERTICAL_MARGIN = 0.024
const PARTICLE_FADE_SPEED = 0.85
const PARTICLE_FADE_SPEED_REDUCED = 0.55
const ENERGY_RELEASE_STRENGTH = 0.0032

const TEAR_FRONT_BASE_X = 0.1556
const TEAR_FRONT_MAX_X = 0.91
const TEAR_FRONT_SPAN_X = TEAR_FRONT_MAX_X - TEAR_FRONT_BASE_X

const computeTearAnchor = (progress: number) => {
  const clamped = clamp01(progress)
  const x = TEAR_FRONT_BASE_X + TEAR_FRONT_SPAN_X * clamped
  const y = clamp01(0.18 + clamped * 0.12)
  return { x, y }
}

const isDevEnvironment = import.meta.env.DEV

const TEAR_VECTOR_X = 1
const TEAR_VECTOR_Y = 0.34
const TEAR_VECTOR_LENGTH = Math.hypot(TEAR_VECTOR_X, TEAR_VECTOR_Y)
const TEAR_DIRECTION_X = TEAR_VECTOR_LENGTH > 0 ? TEAR_VECTOR_X / TEAR_VECTOR_LENGTH : 1
const TEAR_DIRECTION_Y = TEAR_VECTOR_LENGTH > 0 ? TEAR_VECTOR_Y / TEAR_VECTOR_LENGTH : 0

type WavePoint = {
  x: number
  y: number
}

const WAVE_SEGMENTS: Array<{ x: number; offset: number }> = [
  { x: 0, offset: 2 },
  { x: 12, offset: -1.6 },
  { x: 28, offset: 1.8 },
  { x: 46, offset: -1.2 },
  { x: 68, offset: 1.6 },
  { x: 88, offset: -1.4 },
  { x: 100, offset: 1.6 },
]

interface FloatingParticle {
  x: number
  y: number
  vx: number
  vy: number
  base: number
}

const supportsVibration = () => typeof navigator !== 'undefined' && 'vibrate' in navigator

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

type PointerMode = 'mouse' | 'touch' | 'pen' | 'unknown'

const resolvePointerMode = (pointerType?: string): PointerMode => {
  switch (pointerType) {
    case 'mouse':
      return 'mouse'
    case 'touch':
      return 'touch'
    case 'pen':
      return 'pen'
    default:
      return 'unknown'
  }
}

const computeTearDistanceForMode = (mode: PointerMode, stage: InteractionStage, width: number) => {
  const baseWidth = width > 0 ? width : TEAR_DISTANCE
  const isPrimed = stage === 'primed'
  const multiplier = (() => {
    if (mode === 'touch') {
      return isPrimed ? 0.6 : 0.54
    }
    if (mode === 'pen') {
      return isPrimed ? 0.7 : 0.64
    }
    return isPrimed ? 0.78 : 0.7
  })()
  const minimum = mode === 'touch' ? 110 : 150
  const maximum = baseWidth * (isPrimed ? 0.92 : 0.86)
  return clamp(baseWidth * multiplier, minimum, Math.max(minimum, maximum))
}

const computeWavePoints = (tearProgress: number, stage: InteractionStage): WavePoint[] => {
  if (stage === 'burst' || stage === 'revealed') {
    return [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]
  }
  const tearDepth = 8 + tearProgress * 40
  return WAVE_SEGMENTS.map(({ x, offset }) => ({
    x: x / 100,
    y: clamp01((tearDepth + offset) / 100),
  }))
}

const evaluateWaveAt = (points: WavePoint[], position: number) => {
  if (points.length === 0) {
    return 0
  }

  if (position <= points[0].x) {
    return points[0].y
  }

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index]
    if (position <= current.x) {
      const previous = points[index - 1]
      const span = current.x - previous.x || 1
      const ratio = (position - previous.x) / span
      return previous.y + (current.y - previous.y) * ratio
    }
  }

  return points[points.length - 1].y
}

const drawRoundedRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2))
  context.moveTo(x + r, y)
  context.lineTo(x + width - r, y)
  context.quadraticCurveTo(x + width, y, x + width, y + r)
  context.lineTo(x + width, y + height - r)
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  context.lineTo(x + r, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - r)
  context.lineTo(x, y + r)
  context.quadraticCurveTo(x, y, x + r, y)
  context.closePath()
}

const getRelativePosition = (element: HTMLElement, clientX: number, clientY: number) => {
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    return { x: 0.5, y: 0.5 }
  }

  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  }
}

const isWithinStartZone = (
  element: HTMLElement,
  clientX: number,
  clientY: number,
  mode: PointerMode
) => {
  const { x, y } = getRelativePosition(element, clientX, clientY)
  const horizontalExtension = (() => {
    switch (mode) {
      case 'touch':
        return START_ZONE_EXTRA_TOUCH_X
      case 'pen':
        return START_ZONE_EXTRA_PEN_X
      case 'mouse':
        return START_ZONE_EXTRA_MOUSE_X
      default:
        return START_ZONE_EXTRA_MOUSE_X
    }
  })()

  const verticalExtension = (() => {
    switch (mode) {
      case 'touch':
        return START_ZONE_EXTRA_TOUCH_Y
      case 'pen':
        return START_ZONE_EXTRA_PEN_Y
      case 'mouse':
        return START_ZONE_EXTRA_MOUSE_Y
      default:
        return START_ZONE_EXTRA_MOUSE_Y
    }
  })()

  const maxX = Math.min(1, START_ZONE_X + START_ZONE_LEEWAY + horizontalExtension)
  const maxY = Math.min(1, START_ZONE_Y + START_ZONE_LEEWAY + verticalExtension)

  return (
    x >= -START_ZONE_LEEWAY &&
    x <= maxX &&
    y >= -START_ZONE_LEEWAY &&
    y <= maxY
  )
}

const isWithinCutlineBand = (element: HTMLElement, clientX: number, clientY: number) => {
  const { x, y } = getRelativePosition(element, clientX, clientY)
  return (
    x >= -START_ZONE_LEEWAY &&
    x <= START_ZONE_X + CUTLINE_BAND_EXTENSION &&
    y >= -START_ZONE_LEEWAY &&
    y <= START_ZONE_Y + CUTLINE_BAND_EXTENSION
  )
}

export const LetterExperience = ({
  letterImage,
  onStageChange,
  onLetterClick,
  letterActionLabel,
}: LetterExperienceProps) => {
  const prefersReducedMotion = usePrefersReducedMotion()

  const [stage, setStage] = useState<InteractionStage>('intro')
  const [tearProgress, setTearProgress] = useState(0)
  const [tearSpeed, setTearSpeed] = useState<TearSpeed>('idle')
  

  const interactionRef = useRef<HTMLDivElement>(null)
  const letterRef = useRef<HTMLDivElement | null>(null)
  const tearStartRef = useRef<{
    originX: number
    originY: number
    progress: number
    time: number
    normalizedX: number
    normalizedY: number
    anchorX: number
    anchorY: number
    baseDistance: number
  } | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const tearVelocityRef = useRef<{ progress: number; time: number }>({
    progress: 0,
    time: 0,
  })
  const tearDebugRef = useRef<{ lastMoveLog: number }>({ lastMoveLog: 0 })
  const alignTimeoutRef = useRef<number | null>(null)
  const hasBurstRef = useRef(false)
  const tearDistanceRef = useRef(TEAR_DISTANCE)
  const pointerModeRef = useRef<PointerMode>('mouse')

  const floatingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const floatingCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const floatingParticlesRef = useRef<FloatingParticle[]>([])
  const floatingAnimationRef = useRef<number | null>(null)
  const floatingSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const floatingConfigRef = useRef<{ stage: InteractionStage; tearProgress: number; tearSpeed: TearSpeed }>(
    { stage: 'intro', tearProgress: 0, tearSpeed: 'idle' }
  )
  const floatingWasBurstRef = useRef(false)
  const clipMetricsRef = useRef<{ radiusX: number; radiusY: number }>({ radiusX: 0.06, radiusY: 0.06 })
  const particleFadeRef = useRef(1)
  const particlesDissipatingRef = useRef(false)
  const floatingOffsetRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 })

  const seedParticles = useCallback(
    (progress: number = 0, stageOverride: InteractionStage = floatingConfigRef.current.stage) => {
      const wavePoints = computeWavePoints(progress, stageOverride)
      const topWave = wavePoints.reduce((min, point) => Math.min(min, point.y), 1)
      const { radiusX, radiusY } = clipMetricsRef.current
      const horizontalPadding = Math.max(MIN_HORIZONTAL_MARGIN, radiusX * 0.75)
      const tentativeLeft = horizontalPadding
      const tentativeRight = Math.max(tentativeLeft + 0.12, 1 - horizontalPadding)
      const horizontalSpan = Math.max(0.18, Math.min(1, tentativeRight) - Math.max(0, tentativeLeft))
      const leftBound = Math.max(0, Math.min(tentativeLeft, 1 - horizontalSpan))

      const bottomPadding = Math.max(MIN_VERTICAL_MARGIN, radiusY * 0.6)
      const bottomBound = Math.min(1 - bottomPadding, 0.985)
      const topBound = Math.min(bottomBound - 0.08, Math.max(topWave, radiusY * 0.7))
      const verticalSpan = Math.max(0.08, bottomBound - topBound)

      floatingParticlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: leftBound + Math.random() * horizontalSpan,
        y: topBound + Math.random() * verticalSpan,
        vx: (Math.random() - 0.5) * 0.006,
        vy: (Math.random() - 0.5) * 0.006,
        base: 0.35 + Math.random() * 0.55,
      }))
    },
    []
  )

  const updateTearDistance = useCallback(
    (mode: PointerMode, stageContext: InteractionStage, elementWidth: number) => {
      tearDistanceRef.current = computeTearDistanceForMode(mode, stageContext, elementWidth)
    },
    []
  )

  const syncCanvasMetrics = useCallback(() => {
    const canvas = floatingCanvasRef.current
    const context = floatingCtxRef.current
    const container = interactionRef.current
    const letterElement = letterRef.current

    if (!canvas || !context || !container || !letterElement) {
      floatingSizeRef.current = { width: 0, height: 0 }
      return false
    }

    const containerRect = container.getBoundingClientRect()
    const letterRect = letterElement.getBoundingClientRect()
    const width = letterRect.width
    const height = letterRect.height

    if (width <= 0 || height <= 0) {
      floatingSizeRef.current = { width: 0, height: 0 }
      return false
    }

    const dpr = window.devicePixelRatio || 1
    const pixelWidth = Math.max(1, Math.round(width * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    const offsetLeft = Math.round((letterRect.left - containerRect.left) * 100) / 100
    const offsetTop = Math.round((letterRect.top - containerRect.top) * 100) / 100

    if (
      Math.abs(floatingOffsetRef.current.left - offsetLeft) > 0.1 ||
      Math.abs(floatingOffsetRef.current.top - offsetTop) > 0.1
    ) {
      canvas.style.left = `${offsetLeft}px`
      canvas.style.top = `${offsetTop}px`
      floatingOffsetRef.current = { left: offsetLeft, top: offsetTop }
    }

    canvas.style.right = 'auto'
    canvas.style.bottom = 'auto'
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    if (typeof context.resetTransform === 'function') {
      context.resetTransform()
    } else {
      context.setTransform(1, 0, 0, 1, 0, 0)
    }

    context.scale(dpr, dpr)
    floatingSizeRef.current = { width, height }

    let radiusNormalizedX = clipMetricsRef.current.radiusX
    let radiusNormalizedY = clipMetricsRef.current.radiusY
    const computedStyle = window.getComputedStyle(letterElement)
    const parseRadiusValue = (value: string) => {
      if (!value) {
        return 0
      }
      const slashIndex = value.indexOf('/')
      const horizontalValue = slashIndex >= 0 ? value.slice(0, slashIndex) : value
      const numeric = parseFloat(horizontalValue)
      return Number.isNaN(numeric) ? 0 : numeric
    }

    const topLeftRadius = parseRadiusValue(computedStyle.borderTopLeftRadius)
    if (topLeftRadius > 0) {
      radiusNormalizedX = clamp01(topLeftRadius / width)
      radiusNormalizedY = clamp01(topLeftRadius / height)
    }

    if (radiusNormalizedX <= 0 || radiusNormalizedY <= 0) {
      const fallbackRadius = Math.min(width, height) * 0.08
      radiusNormalizedX = clamp01(fallbackRadius / (width || 1))
      radiusNormalizedY = clamp01(fallbackRadius / (height || 1))
    }

    clipMetricsRef.current = {
      radiusX: radiusNormalizedX,
      radiusY: radiusNormalizedY,
    }

    return true
  }, [])

  const clearAlignTimeout = useCallback(() => {
    if (alignTimeoutRef.current !== null) {
      window.clearTimeout(alignTimeoutRef.current)
      alignTimeoutRef.current = null
    }
  }, [])

  const promptAlignStage = useCallback(() => {
    clearAlignTimeout()
    setStage((prev) => (prev === 'burst' || prev === 'revealed' ? prev : 'aligning'))
    alignTimeoutRef.current = window.setTimeout(() => {
      setStage((prevStage) => (prevStage === 'aligning' ? 'idle' : prevStage))
      alignTimeoutRef.current = null
    }, 1100)
  }, [clearAlignTimeout])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStage('idle')
    }, 320)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearAlignTimeout()
    }
  }, [clearAlignTimeout])

  useEffect(() => {
    floatingConfigRef.current = { stage, tearProgress, tearSpeed }

    if (!floatingWasBurstRef.current && stage === 'burst') {
      floatingParticlesRef.current.forEach((particle) => {
        particle.vx += (Math.random() - 0.5) * 0.18
        particle.vy += (Math.random() - 0.5) * 0.14 - 0.08
      })
      floatingWasBurstRef.current = true
    } else if (floatingWasBurstRef.current && stage !== 'burst') {
      floatingWasBurstRef.current = false
    }

    if (stage === 'idle' && tearProgress <= 0.01) {
      floatingParticlesRef.current.forEach((particle) => {
        particle.vx *= 0.4
        particle.vy *= 0.4
      })
    }
  }, [stage, tearProgress, tearSpeed])

  useEffect(() => {
    onStageChange?.(stage)
  }, [onStageChange, stage])

  useEffect(() => {
    if (stage !== 'burst' && stage !== 'revealed') {
      particlesDissipatingRef.current = false
      particleFadeRef.current = 1
      if (floatingParticlesRef.current.length === 0) {
        seedParticles(tearProgress, stage)
      }
    }
  }, [seedParticles, stage, tearProgress])

  useEffect(() => {
    const canvas = floatingCanvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    floatingCtxRef.current = ctx

    syncCanvasMetrics()
    seedParticles(floatingConfigRef.current.tearProgress, floatingConfigRef.current.stage)

    let lastTime = performance.now()

    const drawFrame = (timestamp: number) => {
      const context = floatingCtxRef.current

      if (!context || !syncCanvasMetrics()) {
        floatingAnimationRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const { width, height } = floatingSizeRef.current

      if (width === 0 || height === 0) {
        floatingAnimationRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const delta = Math.min((timestamp - lastTime) / 1000, 0.06)
      lastTime = timestamp

      const config = floatingConfigRef.current
      const particles = floatingParticlesRef.current
      const wavePoints = computeWavePoints(config.tearProgress, config.stage)
      const speedBoost = config.tearSpeed === 'fast' ? 0.28 : config.tearSpeed === 'slow' ? 0.12 : 0
      const driftFactor = 0.12 + config.tearProgress * 0.9 + speedBoost
      const movementScale = delta * 60
      const intensityBase = 0.22 + config.tearProgress * 0.78 + (config.stage === 'tearing' ? 0.12 : 0)
      const intensity = Math.min(1.1, intensityBase + (config.tearSpeed === 'fast' ? 0.08 : 0))
      const waveTop = wavePoints.reduce((min, point) => Math.min(min, point.y), 1)
      const waveAverage = wavePoints.reduce((sum, point) => sum + point.y, 0) / wavePoints.length
      const { radiusX, radiusY } = clipMetricsRef.current
      let leftBoundary = Math.max(MIN_HORIZONTAL_MARGIN, radiusX * 0.72)
      let rightBoundary = 1 - leftBoundary
      if (rightBoundary - leftBoundary < 0.16) {
        leftBoundary = Math.max(0, 0.5 - 0.08)
        rightBoundary = Math.min(1, 0.5 + 0.08)
      }
      const bottomPadding = Math.max(MIN_VERTICAL_MARGIN, radiusY * 0.5)
      const bottomBoundary = Math.min(1 - bottomPadding, 0.985)
      const baseTopLimit = Math.min(bottomBoundary - 0.08, Math.max(waveTop, radiusY * 0.66))
      const isDissipating = particlesDissipatingRef.current
      const centerX = (leftBoundary + rightBoundary) * 0.5
      const centerYBase = Math.max(baseTopLimit, waveAverage)
      const centerYOffset = isDissipating ? 0.68 : 0.52
      const centerY = Math.min(
        bottomBoundary - 0.02,
        centerYBase + (bottomBoundary - centerYBase) * centerYOffset
      )
      if (isDissipating) {
        const fadeSpeed = prefersReducedMotion ? PARTICLE_FADE_SPEED_REDUCED : PARTICLE_FADE_SPEED
        particleFadeRef.current = Math.max(0, particleFadeRef.current - delta * fadeSpeed)
        if (particleFadeRef.current === 0) {
          particlesDissipatingRef.current = false
        }
      }
      const fadeFactor = particleFadeRef.current

      context.save()
      context.clearRect(0, 0, width, height)

      if (fadeFactor <= 0 || particles.length === 0) {
        context.restore()
        if (particles.length !== 0) {
          floatingParticlesRef.current = []
        }
        floatingAnimationRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const cornerRadius = Math.min(width * radiusX, height * radiusY)
      context.beginPath()
      drawRoundedRectPath(context, 0, 0, width, height, cornerRadius)
      context.clip()

      context.beginPath()
      wavePoints.forEach((point, index) => {
        const px = point.x * width
        const py = point.y * height
        if (index === 0) {
          context.moveTo(px, py)
        } else {
          context.lineTo(px, py)
        }
      })
      context.lineTo(width, height)
      context.lineTo(0, height)
      context.closePath()
      context.clip()

      context.globalCompositeOperation = 'lighter'

      const releaseStrength = isDissipating
        ? ENERGY_RELEASE_STRENGTH * (prefersReducedMotion ? 0.55 : 1)
        : 0

      particles.forEach((particle) => {
        if (!prefersReducedMotion) {
          particle.vx += (Math.random() - 0.5) * 0.0032 * driftFactor
          particle.vy += (Math.random() - 0.5) * 0.0032 * driftFactor
        }

        if (releaseStrength !== 0) {
          particle.vx += (particle.x - centerX) * releaseStrength
          particle.vy += (particle.y - centerY) * releaseStrength
        }

        const maxVelocity = 0.02 + config.tearProgress * 0.12
        particle.vx = clamp(particle.vx, -maxVelocity, maxVelocity)
        particle.vy = clamp(particle.vy, -maxVelocity, maxVelocity)

        particle.x += particle.vx * movementScale
        particle.y += particle.vy * movementScale

        if (particle.x < leftBoundary) {
          particle.x = leftBoundary
          particle.vx = Math.abs(particle.vx) * 0.62
        } else if (particle.x > rightBoundary) {
          particle.x = rightBoundary
          particle.vx = -Math.abs(particle.vx) * 0.62
        }

        const waveLimit = evaluateWaveAt(wavePoints, particle.x)
        const topCandidate = Math.max(baseTopLimit, waveLimit)
        const maxTop = bottomBoundary - 0.04
        const topBoundary = Math.min(maxTop, topCandidate)
        if (particle.y < topBoundary) {
          particle.y = topBoundary
          particle.vy = Math.abs(particle.vy) * 0.64
        } else if (particle.y > bottomBoundary) {
          particle.y = bottomBoundary
          particle.vy = -Math.abs(particle.vy) * 0.64
        }
      })

      particles.forEach((particle) => {
        const px = particle.x * width
        const py = particle.y * height
        const radius = 1.1 + particle.base * 2.2 + config.tearProgress * 1.4
        const alpha = Math.min(1, (0.15 + particle.base * 0.55 + intensity * 0.55) * fadeFactor)

        if (alpha <= 0) {
          return
        }

        const gradient = context.createRadialGradient(px, py, 0, px, py, radius * 1.8)
        gradient.addColorStop(0, `rgba(142, 229, 255, ${alpha})`)
        gradient.addColorStop(0.55, `rgba(206, 174, 255, ${alpha * 0.65})`)
        gradient.addColorStop(1, 'rgba(142, 229, 255, 0)')

        context.fillStyle = gradient
        context.beginPath()
        context.arc(px, py, radius * 1.8, 0, Math.PI * 2)
        context.fill()
      })

      context.restore()

      floatingAnimationRef.current = requestAnimationFrame(drawFrame)
    }

    floatingAnimationRef.current = requestAnimationFrame(drawFrame)

    return () => {
      if (floatingAnimationRef.current) {
        cancelAnimationFrame(floatingAnimationRef.current)
        floatingAnimationRef.current = null
      }

      floatingParticlesRef.current = []
      floatingCtxRef.current = null
    }
  }, [prefersReducedMotion, seedParticles, syncCanvasMetrics])

  const triggerBurst = useCallback(() => {
    if (hasBurstRef.current) {
      return
    }

    hasBurstRef.current = true
    clearAlignTimeout()
    setStage('burst')
    setTearProgress(1)
    setTearSpeed('fast')
    particlesDissipatingRef.current = true
    particleFadeRef.current = 1
    tearVelocityRef.current = { progress: 1, time: performance.now() }

    if (supportsVibration()) {
      navigator.vibrate?.([0, prefersReducedMotion ? 24 : 42])
    }

    const element = interactionRef.current
    if (element && pointerIdRef.current !== null && element.hasPointerCapture(pointerIdRef.current)) {
      element.releasePointerCapture(pointerIdRef.current)
    }
    pointerIdRef.current = null
    tearStartRef.current = null

    const delay = prefersReducedMotion ? 280 : 460
    window.setTimeout(() => {
      setStage('revealed')
    }, delay)
  }, [clearAlignTimeout, prefersReducedMotion])

  const resetTear = useCallback(
    (nextStage: InteractionStage = 'idle') => {
      tearStartRef.current = null
      tearVelocityRef.current = { progress: 0, time: performance.now() }
      tearDistanceRef.current = TEAR_DISTANCE
      hasBurstRef.current = false
      tearDebugRef.current.lastMoveLog = 0
      setTearSpeed('idle')
      setTearProgress(0)
      setStage((prev) => (prev === 'burst' || prev === 'revealed' ? prev : nextStage))
      if (isDevEnvironment) {
        console.info('[LetterExperience] tear-reset', { stage: nextStage })
      }
    },
    []
  )

  const startTear = useCallback(
    (native: PointerEvent, baseProgress: number) => {
      const now = performance.now()
      const container = interactionRef.current
      let normalizedX = clamp01(START_ZONE_X)
      let normalizedY = clamp01(START_ZONE_Y)

      if (container) {
        const rect = container.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          normalizedX = clamp01((native.clientX - rect.left) / rect.width)
          normalizedY = clamp01((native.clientY - rect.top) / rect.height)
        }
      }

      const anchor = computeTearAnchor(baseProgress)
      const tearDistance = Math.max(tearDistanceRef.current, 40)
      const baseDistance = clamp(tearDistance * baseProgress, 0, tearDistance)

      tearStartRef.current = {
        originX: native.clientX,
        originY: native.clientY,
        progress: baseProgress,
        time: now,
        normalizedX,
        normalizedY,
        anchorX: anchor.x,
        anchorY: anchor.y,
        baseDistance,
      }
      tearVelocityRef.current = { progress: baseProgress, time: now }
      hasBurstRef.current = false
      clearAlignTimeout()
      setStage('tearing')
      setTearSpeed('slow')
      setTearProgress(baseProgress)

      if (isDevEnvironment) {
        tearDebugRef.current.lastMoveLog = now
        console.info('[LetterExperience] tear-start', {
          mode: pointerModeRef.current,
          progress: Number(baseProgress.toFixed(3)),
          pointerX: Number(normalizedX.toFixed(3)),
          pointerY: Number(normalizedY.toFixed(3)),
          anchorX: Number(anchor.x.toFixed(3)),
          anchorY: Number(anchor.y.toFixed(3)),
          distancePx: Number(baseDistance.toFixed(1)),
          requiredPx: Number(tearDistance.toFixed(1)),
        })
      }
    },
    [clearAlignTimeout]
  )

  const updateTear = useCallback(
    (native: PointerEvent) => {
      const startState = tearStartRef.current
      if (!startState) {
        return
      }

      const pointerMode = pointerModeRef.current
      const container = interactionRef.current

      if (!container) {
        return
      }

      const rect = container.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return
      }

      const pointerNormalizedX = clamp01((native.clientX - rect.left) / rect.width)
      const pointerNormalizedY = clamp01((native.clientY - rect.top) / rect.height)

      const tearDistance = Math.max(tearDistanceRef.current, 40)
      const deltaX = native.clientX - startState.originX
      const deltaY = native.clientY - startState.originY

      let projected = deltaX * TEAR_DIRECTION_X + deltaY * TEAR_DIRECTION_Y
      if (!Number.isFinite(projected)) {
        projected = 0
      }

      if (projected < 0) {
        const backtrackLimit = tearDistance * (pointerMode === 'touch' ? 0.28 : pointerMode === 'pen' ? 0.3 : 0.34)
        projected = Math.max(projected, -backtrackLimit)
      }

      const nextDistance = clamp(startState.baseDistance + projected, 0, tearDistance)
      const nextProgress = Number((nextDistance / tearDistance).toFixed(3))

      setTearProgress(nextProgress)

      const previousVelocity = tearVelocityRef.current
      const now = performance.now()
      const deltaTime = (now - previousVelocity.time) / 1000
      if (deltaTime > 0) {
        const velocity = (nextProgress - previousVelocity.progress) / deltaTime
        if (velocity > 0.9) {
          setTearSpeed('fast')
        } else if (velocity > 0.2) {
          setTearSpeed('slow')
        } else {
          setTearSpeed('idle')
        }
      }

      tearVelocityRef.current = { progress: nextProgress, time: now }

      const updatedAnchor = computeTearAnchor(nextProgress)
      tearStartRef.current = {
        ...startState,
        progress: nextProgress,
        time: now,
        normalizedX: pointerNormalizedX,
        normalizedY: pointerNormalizedY,
        anchorX: updatedAnchor.x,
        anchorY: updatedAnchor.y,
      }

      if (isDevEnvironment) {
        const lastLog = tearDebugRef.current.lastMoveLog
        if (now - lastLog > 120) {
          tearDebugRef.current.lastMoveLog = now
          const deltaTimeSafe = Math.max(deltaTime, 0.0001)
          console.info('[LetterExperience] tear-move', {
            mode: pointerMode,
            progress: Number(nextProgress.toFixed(3)),
            pointerX: Number(pointerNormalizedX.toFixed(3)),
            pointerY: Number(pointerNormalizedY.toFixed(3)),
            deltaX: Number(deltaX.toFixed(1)),
            deltaY: Number(deltaY.toFixed(1)),
            distancePx: Number(nextDistance.toFixed(1)),
            anchorX: Number(updatedAnchor.x.toFixed(3)),
            anchorY: Number(updatedAnchor.y.toFixed(3)),
            velocity: Number(
              ((nextProgress - previousVelocity.progress) / deltaTimeSafe).toFixed(3)
            ),
          })
        }
      }

      if (nextProgress >= 1) {
        triggerBurst()
      }
    },
    [triggerBurst]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      if (event.pointerType !== 'mouse') {
        event.preventDefault()
      }

      const element = event.currentTarget
      element.focus({ preventScroll: true })

      const mode = resolvePointerMode(event.pointerType)

      const allowStart =
        stage === 'primed'
          ? isWithinCutlineBand(element, event.clientX, event.clientY)
          : isWithinStartZone(element, event.clientX, event.clientY, mode)

      if (!allowStart) {
        promptAlignStage()
        tearStartRef.current = null
        setTearSpeed('idle')
        return
      }

      element.setPointerCapture?.(event.pointerId)
      pointerIdRef.current = event.pointerId

      pointerModeRef.current = mode
      const referenceWidth = element.getBoundingClientRect().width
      updateTearDistance(mode, stage, referenceWidth)

      const baseProgress = stage === 'primed' ? tearProgress : 0
      startTear(event.nativeEvent, baseProgress)
    },
    [promptAlignStage, stage, startTear, tearProgress, updateTearDistance]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage === 'tearing') {
        updateTear(event.nativeEvent)
        return
      }

      if (stage === 'aligning') {
        const element = event.currentTarget
        const mode = resolvePointerMode(event.pointerType)
        if (isWithinStartZone(element, event.clientX, event.clientY, mode)) {
          element.setPointerCapture?.(event.pointerId)
          pointerIdRef.current = event.pointerId
          pointerModeRef.current = mode
          const referenceWidth = element.getBoundingClientRect().width
          updateTearDistance(mode, 'tearing', referenceWidth)
          startTear(event.nativeEvent, 0)
        }
        return
      }

      if (stage === 'primed') {
        const element = event.currentTarget
        if (!isWithinCutlineBand(element, event.clientX, event.clientY)) {
          return
        }

        if (!tearStartRef.current) {
          element.setPointerCapture?.(event.pointerId)
          pointerIdRef.current = event.pointerId
          const mode = resolvePointerMode(event.pointerType)
          pointerModeRef.current = mode
          const referenceWidth = element.getBoundingClientRect().width
          updateTearDistance(mode, 'primed', referenceWidth)
          startTear(event.nativeEvent, tearProgress)
        }

        if (tearStartRef.current) {
          updateTear(event.nativeEvent)
        }
      }
    },
    [stage, startTear, tearProgress, updateTear, updateTearDistance]
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== null && event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
        event.currentTarget.releasePointerCapture(pointerIdRef.current)
        pointerIdRef.current = null
      }

      if (stage === 'tearing') {
        const currentProgress = tearProgress
        if (currentProgress >= AUTO_BURST_THRESHOLD) {
          triggerBurst()
          return
        }
        resetTear('idle')
        if (currentProgress > 0.18) {
          promptAlignStage()
        }
        return
      }

      if (stage === 'aligning') {
        clearAlignTimeout()
        resetTear('idle')
        return
      }

      if (stage === 'primed') {
        resetTear('idle')
        promptAlignStage()
      }
    },
    [clearAlignTimeout, promptAlignStage, resetTear, stage, tearProgress, triggerBurst]
  )

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== null && event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
        event.currentTarget.releasePointerCapture(pointerIdRef.current)
        pointerIdRef.current = null
      }

      if (stage === 'tearing' || stage === 'primed') {
        const currentProgress = tearProgress
        if (currentProgress >= AUTO_BURST_THRESHOLD) {
          triggerBurst()
        } else if (tearProgress <= 0.02) {
          resetTear('idle')
        } else {
          resetTear('idle')
          promptAlignStage()
        }
        return
      }

      if (stage === 'aligning') {
        clearAlignTimeout()
        resetTear('idle')
      }
    },
    [clearAlignTimeout, promptAlignStage, resetTear, stage, tearProgress, triggerBurst]
  )

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage === 'tearing') {
        handlePointerUp(event)
        return
      }

      if (stage === 'aligning') {
        clearAlignTimeout()
        resetTear('idle')
        return
      }
      if (stage === 'primed') {
        resetTear('idle')
        promptAlignStage()
      }
    },
    [clearAlignTimeout, handlePointerUp, promptAlignStage, resetTear, stage]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return
      }

      event.preventDefault()

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      setStage('tearing')
      setTearSpeed('slow')

      const increment = event.repeat ? 0.12 : 0.24
      setTearProgress((prev) => {
        const next = clamp(prev + increment, 0, 1)
        if (next >= 1) {
          window.setTimeout(() => {
            triggerBurst()
          }, 0)
        }
        return next
      })
    },
    [stage, triggerBurst]
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return
      }

      event.preventDefault()

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      const currentProgress = tearProgress

      if (currentProgress >= AUTO_BURST_THRESHOLD) {
        triggerBurst()
        return
      }

      resetTear('idle')
      if (currentProgress > 0.18) {
        promptAlignStage()
      }
    },
    [promptAlignStage, resetTear, stage, tearProgress, triggerBurst]
  )

  const tearPercent = Math.round(tearProgress * 100)

  const liveStatus = useMemo(() => {
    switch (stage) {
      case 'aligning':
        return '開始位置を探しています'
      case 'tearing':
        return `破り ${tearPercent}%`
      case 'burst':
        return '破り切りました'
      case 'revealed':
        return '開封が完了しました'
      default:
        return ''
    }
  }, [stage, tearPercent])

  const visualStyle = useMemo(() => {
    const tearDepth = (8 + tearProgress * 40).toFixed(2)
    const tearScale = (0.08 + tearProgress * 0.92).toFixed(3)
    const letterReveal = clamp(tearProgress * 1.12, 0, 1).toFixed(3)
    const tearFray = `${(tearProgress * 18).toFixed(2)}px`
    const tearShift = `${(tearProgress * 8).toFixed(2)}px`

    return {
      '--letter-tear-progress': tearProgress.toFixed(3),
      '--letter-tear-depth': `${tearDepth}%`,
      '--letter-tear-scale': tearScale,
      '--letter-letter-reveal': letterReveal,
      '--letter-tear-fray': tearFray,
      '--letter-tear-shift': tearShift,
    } as CSSProperties
  }, [tearProgress])

  const packClassName = useMemo(() => {
    const classes = ['letter-pack', `letter-pack--${stage}`]
    if (tearSpeed !== 'idle') {
      classes.push(`letter-pack--tear-${tearSpeed}`)
    }
    if (prefersReducedMotion) {
      classes.push('letter-pack--reduced')
    }
    return classes.join(' ')
  }, [prefersReducedMotion, stage, tearSpeed])

  const rootClassName = useMemo(() => {
    const classes = ['letter-experience']
    if (stage === 'revealed') {
      classes.push('letter-experience--revealed')
    }
    return classes.join(' ')
  }, [stage])

  const isLetterInteractive = useMemo(
    () => stage === 'revealed' && Boolean(letterImage) && typeof onLetterClick === 'function',
    [letterImage, onLetterClick, stage]
  )

  const handleLetterClick = useCallback(() => {
    if (!isLetterInteractive) {
      return
    }
    onLetterClick?.()
  }, [isLetterInteractive, onLetterClick])

  const handleLetterKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!isLetterInteractive) {
        return
      }

      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        onLetterClick?.()
      }
    },
    [isLetterInteractive, onLetterClick]
  )

  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => (
        <span key={index} className="letter-pack__particle" data-index={index} aria-hidden="true" />
      )),
    []
  )

  return (
    <div className={rootClassName}>
      <div className="letter-experience__stage">
        <div
          ref={interactionRef}
          className={packClassName}
          data-stage={stage}
          data-speed={tearSpeed}
          style={visualStyle}
          role="button"
          tabIndex={0}
          aria-label="スキャンした手紙を守るトレーディングカードのパック。左上の切り取り線を長押しして右へスライドしてください"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          <div className="letter-pack__halo" aria-hidden="true" />
          <div className="letter-pack__glow" aria-hidden="true" />
          <div className="letter-pack__base" aria-hidden="true">
            <div className="letter-pack__foil" aria-hidden="true" />
            <div className="letter-pack__texture" aria-hidden="true" />
            <div className="letter-pack__seal" aria-hidden="true" />
            <div className="letter-pack__cutline" aria-hidden="true" />
            <div className="letter-pack__tear-edge" aria-hidden="true" />
          </div>
          <canvas className="letter-pack__lights" ref={floatingCanvasRef} aria-hidden="true" />
          <div
            className="letter-pack__letter"
            ref={letterRef}
            aria-hidden={!letterImage}
            role={isLetterInteractive ? 'button' : undefined}
            tabIndex={isLetterInteractive ? 0 : -1}
            aria-label={isLetterInteractive ? letterActionLabel ?? '手紙を表示する' : undefined}
            onClick={isLetterInteractive ? handleLetterClick : undefined}
            onKeyDown={isLetterInteractive ? handleLetterKeyDown : undefined}
            data-interactive={isLetterInteractive ? 'true' : undefined}
          >
            {letterImage ? (
              <img src={letterImage.src} alt={letterImage.alt ?? 'スキャンした手紙'} />
            ) : (
              <div className="letter-pack__letter-placeholder" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <div className="letter-pack__bundle" aria-hidden="true">
            <span className="letter-pack__card letter-pack__card--back" />
            <span className="letter-pack__card letter-pack__card--mid" />
            <span className="letter-pack__card letter-pack__card--front" />
          </div>
          <div className="letter-pack__particles" aria-hidden="true">
            {particles}
          </div>
        </div>
        <div className="letter-hints" aria-hidden="true" />
        <span className="letter-hints__live" aria-live="polite">
          {liveStatus}
        </span>
      </div>
    </div>
  )
}
