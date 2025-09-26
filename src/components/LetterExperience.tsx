import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface LetterExperienceProps {
  letterImage?: {
    src: string
    alt?: string
  }
}

type InteractionStage =
  | 'intro'
  | 'idle'
  | 'aligning'
  | 'tearing'
  | 'primed'
  | 'burst'
  | 'revealed'

type TearSpeed = 'idle' | 'slow' | 'fast'

const TEAR_DISTANCE = 280
const AUTO_BURST_THRESHOLD = 0.82
const START_ZONE_X = 0.32
const START_ZONE_Y = 0.36
const START_ZONE_LEEWAY = 0.08
const CUTLINE_BAND_EXTENSION = 0.18
const PARTICLE_COUNT = 365

interface FloatingParticle {
  x: number
  y: number
  vx: number
  vy: number
  base: number
}

const supportsVibration = () => typeof navigator !== 'undefined' && 'vibrate' in navigator

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

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

const isWithinStartZone = (element: HTMLElement, clientX: number, clientY: number) => {
  const { x, y } = getRelativePosition(element, clientX, clientY)
  return (
    x >= -START_ZONE_LEEWAY &&
    x <= START_ZONE_X + START_ZONE_LEEWAY &&
    y >= -START_ZONE_LEEWAY &&
    y <= START_ZONE_Y + START_ZONE_LEEWAY
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

export const LetterExperience = ({ letterImage }: LetterExperienceProps) => {
  const prefersReducedMotion = usePrefersReducedMotion()

  const [stage, setStage] = useState<InteractionStage>('intro')
  const [tearProgress, setTearProgress] = useState(0)
  const [tearSpeed, setTearSpeed] = useState<TearSpeed>('idle')
  const [isKeyboardActive, setIsKeyboardActive] = useState(false)

  const interactionRef = useRef<HTMLDivElement>(null)
  const tearStartRef = useRef<{
    x: number
    y: number
    progress: number
    time: number
  } | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const tearVelocityRef = useRef<{ progress: number; time: number }>({
    progress: 0,
    time: 0,
  })
  const alignTimeoutRef = useRef<number | null>(null)
  const hasBurstRef = useRef(false)

  const floatingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const floatingCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const floatingParticlesRef = useRef<FloatingParticle[]>([])
  const floatingAnimationRef = useRef<number | null>(null)
  const floatingSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const floatingConfigRef = useRef<{ stage: InteractionStage; tearProgress: number; tearSpeed: TearSpeed }>(
    { stage: 'intro', tearProgress: 0, tearSpeed: 'idle' }
  )
  const floatingResizeObserverRef = useRef<ResizeObserver | null>(null)
  const floatingWasBurstRef = useRef(false)

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
    const canvas = floatingCanvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    floatingCtxRef.current = ctx

    const initializeParticles = () => {
      floatingParticlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.006,
        vy: (Math.random() - 0.5) * 0.006,
        base: 0.35 + Math.random() * 0.55,
      }))
    }

    initializeParticles()

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      if (typeof ctx.resetTransform === 'function') {
        ctx.resetTransform()
      } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
      ctx.scale(dpr, dpr)
      floatingSizeRef.current = { width: rect.width, height: rect.height }
    }

    updateCanvasSize()

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })
    resizeObserver.observe(canvas)
    floatingResizeObserverRef.current = resizeObserver

    let lastTime = performance.now()

    const drawFrame = (timestamp: number) => {
      const context = floatingCtxRef.current
      const { width, height } = floatingSizeRef.current

      if (!context || width === 0 || height === 0) {
        floatingAnimationRef.current = requestAnimationFrame(drawFrame)
        return
      }

      const delta = Math.min((timestamp - lastTime) / 1000, 0.06)
      lastTime = timestamp

      const config = floatingConfigRef.current
      const particles = floatingParticlesRef.current
      const speedBoost = config.tearSpeed === 'fast' ? 0.28 : config.tearSpeed === 'slow' ? 0.12 : 0
      const driftFactor = 0.12 + config.tearProgress * 0.9 + speedBoost
      const movementScale = delta * 60
      const intensityBase = 0.22 + config.tearProgress * 0.78 + (config.stage === 'tearing' ? 0.12 : 0)
      const intensity = Math.min(1.1, intensityBase + (config.tearSpeed === 'fast' ? 0.08 : 0))

      context.save()
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      if (!prefersReducedMotion) {
        particles.forEach((particle) => {
          particle.vx += (Math.random() - 0.5) * 0.0032 * driftFactor
          particle.vy += (Math.random() - 0.5) * 0.0032 * driftFactor

          const maxVelocity = 0.02 + config.tearProgress * 0.12
          particle.vx = clamp(particle.vx, -maxVelocity, maxVelocity)
          particle.vy = clamp(particle.vy, -maxVelocity, maxVelocity)

          particle.x += particle.vx * movementScale
          particle.y += particle.vy * movementScale

          if (particle.x < 0) {
            particle.x = 0
            particle.vx = Math.abs(particle.vx) * 0.6
          } else if (particle.x > 1) {
            particle.x = 1
            particle.vx = -Math.abs(particle.vx) * 0.6
          }

          if (particle.y < 0) {
            particle.y = 0
            particle.vy = Math.abs(particle.vy) * 0.6
          } else if (particle.y > 1) {
            particle.y = 1
            particle.vy = -Math.abs(particle.vy) * 0.6
          }
        })
      }

      particles.forEach((particle) => {
        const px = particle.x * width
        const py = particle.y * height
        const radius = 1.1 + particle.base * 2.2 + config.tearProgress * 1.4
        const alpha = Math.min(1, 0.15 + particle.base * 0.55 + intensity * 0.55)

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

      floatingResizeObserverRef.current?.disconnect()
      floatingResizeObserverRef.current = null
      floatingParticlesRef.current = []
      floatingCtxRef.current = null
    }
  }, [prefersReducedMotion])

  const triggerBurst = useCallback(() => {
    if (hasBurstRef.current) {
      return
    }

    hasBurstRef.current = true
    clearAlignTimeout()
    setStage('burst')
    setTearProgress(1)
    setTearSpeed('fast')

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

  const startTear = useCallback(
    (native: PointerEvent, baseProgress: number) => {
      const now = performance.now()
      tearStartRef.current = {
        x: native.clientX,
        y: native.clientY,
        progress: baseProgress,
        time: now,
      }
      tearVelocityRef.current = { progress: baseProgress, time: now }
      hasBurstRef.current = false
      clearAlignTimeout()
      setStage('tearing')
      setTearSpeed('slow')
      setTearProgress(baseProgress)
    },
    [clearAlignTimeout]
  )

  const updateTear = useCallback(
    (native: PointerEvent) => {
      if (!tearStartRef.current) {
        return
      }

      const base = tearStartRef.current
      const deltaX = native.clientX - base.x
      const deltaY = native.clientY - base.y
      const horizontal = Math.max(deltaX, 0)
      const vertical = Math.max(Math.abs(deltaY) - 6, 0) * 0.12
      const rawProgress = base.progress + (horizontal + vertical) / TEAR_DISTANCE
      const nextProgress = clamp(rawProgress, 0, 1)

      const now = performance.now()
      const last = tearVelocityRef.current
      const deltaProgress = nextProgress - last.progress
      const deltaTime = (now - last.time) / 1000

      setTearProgress(nextProgress)

      if (deltaTime > 0) {
        const velocity = deltaProgress / deltaTime
        if (velocity > 0.8) {
          setTearSpeed('fast')
        } else if (velocity > 0.18) {
          setTearSpeed('slow')
        } else {
          setTearSpeed('idle')
        }
      }

      tearVelocityRef.current = { progress: nextProgress, time: now }

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

      const allowStart =
        stage === 'primed'
          ? isWithinCutlineBand(element, event.clientX, event.clientY)
          : isWithinStartZone(element, event.clientX, event.clientY)

      if (!allowStart) {
        promptAlignStage()
        tearStartRef.current = null
        setTearSpeed('idle')
        return
      }

      element.setPointerCapture?.(event.pointerId)
      pointerIdRef.current = event.pointerId

      const baseProgress = stage === 'primed' ? tearProgress : 0
      startTear(event.nativeEvent, baseProgress)
    },
    [promptAlignStage, stage, startTear, tearProgress]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage === 'tearing') {
        updateTear(event.nativeEvent)
        return
      }

      if (stage === 'aligning') {
        const element = event.currentTarget
        if (isWithinStartZone(element, event.clientX, event.clientY)) {
          element.setPointerCapture?.(event.pointerId)
          pointerIdRef.current = event.pointerId
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
          startTear(event.nativeEvent, tearProgress)
        }

        if (tearStartRef.current) {
          updateTear(event.nativeEvent)
        }
      }
    },
    [stage, startTear, tearProgress, updateTear]
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== null && event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
        event.currentTarget.releasePointerCapture(pointerIdRef.current)
        pointerIdRef.current = null
      }

      if (stage === 'tearing') {
        tearStartRef.current = null
        if (tearProgress >= AUTO_BURST_THRESHOLD) {
          triggerBurst()
          return
        }
        if (tearProgress <= 0.02) {
          setTearProgress(0)
          setStage('idle')
        } else {
          setStage('primed')
        }
        setTearSpeed('idle')
        return
      }

      if (stage === 'aligning') {
        clearAlignTimeout()
        setStage('idle')
        setTearProgress(0)
        return
      }
    },
    [clearAlignTimeout, stage, tearProgress, triggerBurst]
  )

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== null && event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
        event.currentTarget.releasePointerCapture(pointerIdRef.current)
        pointerIdRef.current = null
      }

      tearStartRef.current = null

      if (stage === 'tearing' || stage === 'primed') {
        if (tearProgress >= AUTO_BURST_THRESHOLD) {
          triggerBurst()
        } else if (tearProgress <= 0.02) {
          setTearProgress(0)
          setStage('idle')
        } else {
          setStage('primed')
        }
        setTearSpeed('idle')
        return
      }

      if (stage === 'aligning') {
        clearAlignTimeout()
        setStage('idle')
        setTearProgress(0)
      }
    },
    [clearAlignTimeout, stage, tearProgress, triggerBurst]
  )

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage === 'tearing') {
        handlePointerUp(event)
        return
      }

      if (stage === 'aligning') {
        clearAlignTimeout()
        setStage('idle')
        setTearProgress(0)
      }
    },
    [clearAlignTimeout, handlePointerUp, stage]
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

      setIsKeyboardActive(true)
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
      setIsKeyboardActive(false)

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      if (tearProgress >= AUTO_BURST_THRESHOLD) {
        triggerBurst()
        return
      }

      if (tearProgress <= 0.02) {
        setTearProgress(0)
        setStage('idle')
      } else {
        setStage('primed')
      }
      setTearSpeed('idle')
    },
    [stage, tearProgress, triggerBurst]
  )

  const tearPercent = Math.round(tearProgress * 100)

  const primaryHint = useMemo(() => {
    switch (stage) {
      case 'intro':
        return 'パックが姿を現しました'
      case 'idle':
        return '切り取り線の左端を押さえてください'
      case 'aligning':
        return '左端に触れてから右へ滑らせてください'
      case 'tearing':
        return '指でそのまま右へ破り進めましょう'
      case 'primed':
        return '途中まで破れています。続きは右へ滑らせてください'
      case 'burst':
        return 'パックが弾けて中身が飛び出します'
      case 'revealed':
        return 'スキャンして保存した手紙を表示しました'
      default:
        return ''
    }
  }, [stage])

  const secondaryHint = useMemo(() => {
    switch (stage) {
      case 'aligning':
        return '左上の丸い印が開始位置です'
      case 'tearing':
        return `破り進行 ${tearPercent}%`
      case 'primed':
        return '切り取り線に沿ってもう一度スライドできます'
      case 'burst':
        return '紙片が舞い散り、カード束が現れます'
      case 'revealed':
        return 'いつでも読めるようにスキャンデータをここに保管しています'
      case 'idle':
        return '開始位置を長押しすると破り始められます'
      default:
        return ''
    }
  }, [stage, tearPercent])

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
          <div className="letter-pack__letter" aria-hidden={!letterImage}>
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
        <div className="letter-hints">
          <p className="letter-hints__primary">{primaryHint}</p>
          {secondaryHint ? <p className="letter-hints__secondary">{secondaryHint}</p> : null}
          {isKeyboardActive ? (
            <span className="letter-hints__keyboard" role="status">
              {`破り進捗 ${tearPercent}%`}
            </span>
          ) : null}
          <span className="letter-hints__live" aria-live="polite">
            {liveStatus}
          </span>
        </div>
      </div>
    </div>
  )
}
