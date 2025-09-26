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
  | 'charging'
  | 'charged'
  | 'primed'
  | 'tearing'
  | 'burst'
  | 'revealed'

type TearSpeed = 'idle' | 'slow' | 'fast'

const CHARGE_DURATION = 1700
const TEAR_DISTANCE = 260
const AUTO_BURST_THRESHOLD = 0.72
const CHARGE_CIRCUMFERENCE = 2 * Math.PI * 74

const supportsVibration = () => typeof navigator !== 'undefined' && 'vibrate' in navigator

export const LetterExperience = ({ letterImage }: LetterExperienceProps) => {
  const prefersReducedMotion = usePrefersReducedMotion()

  const [stage, setStage] = useState<InteractionStage>('intro')
  const [chargeProgress, setChargeProgress] = useState(0)
  const [tearProgress, setTearProgress] = useState(0)
  const [tearSpeed, setTearSpeed] = useState<TearSpeed>('idle')
  const [isKeyboardActive, setIsKeyboardActive] = useState(false)

  const interactionRef = useRef<HTMLDivElement>(null)
  const chargeStartRef = useRef(0)
  const chargeRafRef = useRef<number | null>(null)
  const isChargingRef = useRef(false)
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
  const vibrationStageRef = useRef(0)
  const hasBurstRef = useRef(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStage('idle')
    }, 320)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current)
        chargeRafRef.current = null
      }

      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const stopChargeTone = useCallback((immediate = false) => {
    const oscillator = oscillatorRef.current
    const gain = gainRef.current
    const audioContext = audioContextRef.current

    if (!audioContext || !gain || !oscillator) {
      return
    }

    const now = audioContext.currentTime
    gain.gain.cancelScheduledValues(now)
    if (immediate) {
      gain.gain.setValueAtTime(0, now)
    } else {
      gain.gain.setTargetAtTime(0, now, 0.08)
    }

    window.setTimeout(() => {
      try {
        oscillator.stop()
      } catch {
        // ignore stop errors
      }
      oscillator.disconnect()
      gain.disconnect()
      oscillatorRef.current = null
      gainRef.current = null
    }, immediate ? 0 : 160)
  }, [])

  const startChargeTone = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      let audioContext = audioContextRef.current
      if (!audioContext) {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext
          }).webkitAudioContext

        if (!AudioContextClass) {
          return
        }

        audioContext = new AudioContextClass()
        audioContextRef.current = audioContext
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()
      gain.gain.setValueAtTime(0, audioContext.currentTime)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(210, audioContext.currentTime)

      oscillator.connect(gain)
      gain.connect(audioContext.destination)

      oscillator.start()
      gain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.12)

      oscillatorRef.current = oscillator
      gainRef.current = gain
    } catch {
      // ignore audio failures (likely due to autoplay policy)
    }
  }, [])

  const scheduleChargeTick = useCallback(() => {
    const tick = (timestamp: number) => {
      if (!isChargingRef.current) {
        chargeRafRef.current = null
        return
      }

      const elapsed = timestamp - chargeStartRef.current
      const nextProgress = Math.min(elapsed / CHARGE_DURATION, 1)

      setChargeProgress(nextProgress)

      const audioContext = audioContextRef.current
      const oscillator = oscillatorRef.current
      const gain = gainRef.current
      if (audioContext && oscillator) {
        oscillator.frequency.setTargetAtTime(200 + nextProgress * 240, audioContext.currentTime, 0.08)
      }
      if (audioContext && gain) {
        gain.gain.setTargetAtTime(0.08 + nextProgress * 0.07, audioContext.currentTime, 0.1)
      }

      if (!prefersReducedMotion) {
        if (nextProgress > 0.75 && vibrationStageRef.current < 2 && supportsVibration()) {
          navigator.vibrate?.(28)
          vibrationStageRef.current = 2
        } else if (nextProgress > 0.4 && vibrationStageRef.current < 1 && supportsVibration()) {
          navigator.vibrate?.(16)
          vibrationStageRef.current = 1
        }
      }

      if (nextProgress >= 1) {
        isChargingRef.current = false
        vibrationStageRef.current = 2
        stopChargeTone(false)
        if (!prefersReducedMotion && supportsVibration()) {
          navigator.vibrate?.(30)
        }
        setStage((prev) => {
          if (prev === 'burst' || prev === 'revealed') {
            return prev
          }
          return 'charged'
        })
        chargeRafRef.current = null
        return
      }

      chargeRafRef.current = requestAnimationFrame(tick)
    }

    chargeRafRef.current = requestAnimationFrame(tick)
  }, [prefersReducedMotion, stopChargeTone])

  const beginCharge = useCallback(async () => {
    if (isChargingRef.current) {
      return
    }

    if (stage === 'primed' || stage === 'tearing' || stage === 'burst' || stage === 'revealed') {
      return
    }

    const resumeProgress = stage === 'charging' ? chargeProgress : 0
    chargeStartRef.current = performance.now() - resumeProgress * CHARGE_DURATION
    isChargingRef.current = true
    vibrationStageRef.current = 0
    setStage('charging')
    setChargeProgress(resumeProgress)
    await startChargeTone()
    scheduleChargeTick()
  }, [chargeProgress, scheduleChargeTick, stage, startChargeTone])

  const finishCharge = useCallback(
    (succeeded: boolean) => {
      if (chargeRafRef.current !== null) {
        cancelAnimationFrame(chargeRafRef.current)
        chargeRafRef.current = null
      }

      if (!isChargingRef.current && stage !== 'charging' && stage !== 'charged') {
        return
      }

      isChargingRef.current = false
      vibrationStageRef.current = 0
      stopChargeTone(!succeeded)

      if (succeeded) {
        setChargeProgress(1)
        setStage((prev) => {
          if (prev === 'burst' || prev === 'revealed') {
            return prev
          }
          return 'primed'
        })
      } else {
        setStage((prev) => (prev === 'charging' || prev === 'charged' ? 'idle' : prev))
        window.setTimeout(() => {
          setChargeProgress(0)
        }, 220)
      }
    },
    [stage, stopChargeTone]
  )

  const triggerBurst = useCallback(() => {
    if (hasBurstRef.current) {
      return
    }

    hasBurstRef.current = true
    setTearProgress(1)
    setChargeProgress(1)
    setStage('burst')
    setTearSpeed('fast')
    stopChargeTone(true)

    if (supportsVibration()) {
      navigator.vibrate?.([0, prefersReducedMotion ? 24 : 42])
    }

    if (interactionRef.current && pointerIdRef.current !== null) {
      interactionRef.current.releasePointerCapture(pointerIdRef.current)
      pointerIdRef.current = null
    }
    tearStartRef.current = null

    const timeout = prefersReducedMotion ? 320 : 520
    window.setTimeout(() => {
      setStage('revealed')
    }, timeout)
  }, [prefersReducedMotion, stopChargeTone])

  const startTear = useCallback(
    (native: PointerEvent) => {
      if (stage !== 'primed' && stage !== 'tearing') {
        return
      }

      const now = performance.now()
      tearStartRef.current = {
        x: native.clientX,
        y: native.clientY,
        progress: tearProgress,
        time: now,
      }
      tearVelocityRef.current = { progress: tearProgress, time: now }
      setStage('tearing')
      setTearSpeed('slow')
    },
    [stage, tearProgress]
  )

  const updateTear = useCallback(
    (native: PointerEvent) => {
      if (!tearStartRef.current) {
        return
      }

      const base = tearStartRef.current
      const deltaX = native.clientX - base.x
      const deltaY = native.clientY - base.y
      const horizontal = Math.max(Math.abs(deltaX), 0)
      const vertical = Math.max(deltaY, 0)
      const distance = horizontal + vertical * 0.35
      const nextProgress = Math.max(
        Math.min(base.progress + distance / TEAR_DISTANCE, 1),
        0
      )

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
    async (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      if (event.pointerType !== 'mouse') {
        event.preventDefault()
      }

      event.currentTarget.focus({ preventScroll: true })
      event.currentTarget.setPointerCapture?.(event.pointerId)
      pointerIdRef.current = event.pointerId

      if (stage === 'primed' || stage === 'tearing') {
        startTear(event.nativeEvent)
        return
      }

      await beginCharge()
    },
    [beginCharge, stage, startTear]
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage !== 'tearing') {
        return
      }

      updateTear(event.nativeEvent)
    },
    [stage, updateTear]
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
        } else {
          setStage('primed')
          setTearSpeed('idle')
        }
        return
      }

      if (stage === 'primed') {
        return
      }

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      const succeeded = chargeProgress >= 0.999 || stage === 'charged'
      finishCharge(succeeded)
    },
    [chargeProgress, finishCharge, stage, tearProgress, triggerBurst]
  )

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== null && event.currentTarget.hasPointerCapture(pointerIdRef.current)) {
        event.currentTarget.releasePointerCapture(pointerIdRef.current)
        pointerIdRef.current = null
      }

      if (stage === 'tearing') {
        tearStartRef.current = null
        setStage('primed')
        setTearSpeed('idle')
        return
      }

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      finishCharge(false)
    },
    [finishCharge, stage]
  )

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (stage !== 'tearing') {
        return
      }
      handlePointerUp(event)
    },
    [handlePointerUp, stage]
  )

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return
      }

      if (event.repeat) {
        event.preventDefault()
        return
      }

      event.preventDefault()

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      if (stage === 'primed') {
        setStage('tearing')
        setTearProgress((prev) => {
          const next = Math.min(prev + 0.35, 1)
          if (next >= 1) {
            window.setTimeout(() => {
              triggerBurst()
            }, 0)
          }
          return next
        })
        return
      }

      if (stage === 'tearing') {
        setTearProgress((prev) => {
          const next = Math.min(prev + 0.35, 1)
          if (next >= 1) {
            window.setTimeout(() => {
              triggerBurst()
            }, 0)
          }
          return next
        })
        return
      }

      setIsKeyboardActive(true)
      await beginCharge()
    },
    [beginCharge, stage, triggerBurst]
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== ' ' && event.key !== 'Enter') {
        return
      }

      event.preventDefault()
      setIsKeyboardActive(false)

      if (stage === 'tearing') {
        if (tearProgress >= AUTO_BURST_THRESHOLD) {
          triggerBurst()
        } else {
          setStage('primed')
          setTearSpeed('idle')
        }
        return
      }

      if (stage === 'primed') {
        triggerBurst()
        return
      }

      if (stage === 'burst' || stage === 'revealed') {
        return
      }

      if (isChargingRef.current || stage === 'charging' || stage === 'charged') {
        const succeeded = chargeProgress >= 0.999 || stage === 'charged'
        finishCharge(succeeded)
      }
    },
    [chargeProgress, finishCharge, stage, tearProgress, triggerBurst]
  )

  const chargeDashOffset = useMemo(
    () => CHARGE_CIRCUMFERENCE - CHARGE_CIRCUMFERENCE * Math.min(chargeProgress, 1),
    [chargeProgress]
  )

  const visualStyle = useMemo(() => {
    const tearDepth = (6 + tearProgress * 38).toFixed(2)
    const tearScale = (0.08 + tearProgress * 0.92).toFixed(3)
    const letterReveal = Math.min(tearProgress * 1.12, 1).toFixed(3)
    const tearFray = `${(tearProgress * 22).toFixed(2)}px`
    const tearShift = `${(tearProgress * 6).toFixed(2)}px`

    return {
      '--letter-charge-progress': chargeProgress.toFixed(3),
      '--letter-tear-progress': tearProgress.toFixed(3),
      '--letter-tear-depth': `${tearDepth}%`,
      '--letter-tear-scale': tearScale,
      '--letter-letter-reveal': letterReveal,
      '--letter-tear-fray': tearFray,
      '--letter-tear-shift': tearShift,
    } as CSSProperties
  }, [chargeProgress, tearProgress])

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

  const chargePercent = Math.round(chargeProgress * 100)
  const tearPercent = Math.round(tearProgress * 100)

  const primaryHint = useMemo(() => {
    switch (stage) {
      case 'intro':
        return 'パックが姿を現しました'
      case 'idle':
        return 'パックを長押しして力を集めましょう'
      case 'charging':
        return 'チャージが満ちるまで指を離さないでください'
      case 'charged':
        return '指を離して裂け目を作りましょう'
      case 'primed':
        return '裂けた上辺から指で横へ破り進めてください'
      case 'tearing':
        return '切り取り線に沿って横へ破りましょう'
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
      case 'charging':
        return `チャージ ${chargePercent}%`
      case 'charged':
        return '縁が脈打ち破りの準備が整いました'
      case 'primed':
        return '再度タップまたは横方向のドラッグで続きが破れます'
      case 'tearing':
        return `破り進行 ${tearPercent}%`
      case 'burst':
        return '紙片が舞い散り、カード束が現れます'
      case 'revealed':
        return 'いつでも読めるようにスキャンデータをここに保管しています'
      case 'idle':
        return '背景が少し明るくなり開封を待っています'
      default:
        return ''
    }
  }, [chargePercent, stage, tearPercent])

  const liveStatus = useMemo(() => {
    switch (stage) {
      case 'charging':
        return `チャージ ${chargePercent}%`
      case 'tearing':
        return `破り ${tearPercent}%`
      case 'burst':
        return '破り切りました'
      case 'revealed':
        return '開封が完了しました'
      default:
        return ''
    }
  }, [chargePercent, stage, tearPercent])

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
          aria-label="スキャンした手紙を守るトレーディングカードのパック。長押しして開封してください"
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
          <div className="letter-pack__charge" aria-hidden="true">
            <svg viewBox="0 0 160 160" focusable="false" role="presentation">
              <circle className="letter-pack__charge-track" cx="80" cy="80" r="74" />
              <circle
                className="letter-pack__charge-progress"
                cx="80"
                cy="80"
                r="74"
                strokeDasharray={CHARGE_CIRCUMFERENCE}
                style={{ strokeDashoffset: chargeDashOffset }}
              />
            </svg>
          </div>
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
              {`長押し進捗 ${chargePercent}%`}
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
