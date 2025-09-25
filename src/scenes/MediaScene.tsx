import {
  type ChangeEvent,
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { TapRippleField } from '../components/TapRippleField'
import { mediaExchangeCounts, totalMedia } from '../data/media'
import type { SceneComponentProps } from '../types/scenes'

const FINAL_TARGET = totalMedia
const TAP_INCREMENT = Math.max(1, Math.ceil(FINAL_TARGET / 36))
const MAX_RINGS = 48

type Ring = {
  id: number
  hue: number
  spin: 1 | -1
  scale: number
  tone: number
  offset: number
  drift: number
  delay: number
  isFading: boolean
}

type ControlState = {
  rotationSpeed: number
  ringFade: number
  glowIntensity: number
  paletteShift: number
  driftStrength: number
}

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const MediaScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(18, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [rings, setRings] = useState<Ring[]>([])
  const [controls, setControls] = useState<ControlState>({
    rotationSpeed: 4200,
    ringFade: 5200,
    glowIntensity: 0.88,
    paletteShift: 32,
    driftStrength: 0.72,
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const timersRef = useRef<number[]>([])
  const fadeStartTimersRef = useRef<Map<number, number>>(new Map())
  const removalTimersRef = useRef<Map<number, number>>(new Map())

  const registerTimer = useCallback((handler: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      handler()
      timersRef.current = timersRef.current.filter((id) => id !== timerId)
    }, delay)
    timersRef.current.push(timerId)
    return timerId
  }, [])

  const clearTimer = useCallback((timerId: number) => {
    window.clearTimeout(timerId)
    timersRef.current = timersRef.current.filter((id) => id !== timerId)
  }, [])

  const removeRing = useCallback((ringId: number) => {
    setRings((prev) => prev.filter((ring) => ring.id !== ringId))
  }, [])

  const startRingFade = useCallback(
    (ringId: number, fadeDuration: number) => {
      let shouldScheduleRemoval = false
      setRings((prev) => {
        let didChange = false
        const next = prev.map((ring) => {
          if (ring.id !== ringId) return ring
          if (ring.isFading) return ring
          didChange = true
          shouldScheduleRemoval = true
          return { ...ring, isFading: true }
        })
        if (!didChange) return prev
        return next
      })

      if (!shouldScheduleRemoval) {
        return
      }

      const existingRemoval = removalTimersRef.current.get(ringId)
      if (existingRemoval !== undefined) {
        clearTimer(existingRemoval)
      }
      const removalDelay = Math.max(480, fadeDuration) + 200
      const removalTimer = registerTimer(() => {
        removalTimersRef.current.delete(ringId)
        removeRing(ringId)
      }, removalDelay)
      removalTimersRef.current.set(ringId, removalTimer)
    },
    [clearTimer, registerTimer, removeRing]
  )

  const stageStyle = useMemo(
    () =>
      ({
        '--media-rotation-speed': `${controls.rotationSpeed}ms`,
        '--media-ring-fade': `${controls.ringFade}ms`,
        '--media-glow-intensity': `${controls.glowIntensity}`,
        '--media-palette-shift': `${controls.paletteShift}deg`,
        '--media-drift-strength': `${controls.driftStrength}`,
      }) as CSSProperties,
    [controls]
  )

  const visibleRings = useMemo(() => rings.slice(-MAX_RINGS), [rings])

  useEffect(() => {
    if (phase !== 'play') return
    if (count >= FINAL_TARGET) {
      setPhase('announce')
    }
  }, [count, phase])

  useEffect(() => {
    if (phase !== 'announce') return
    setCtaVisible(false)
    const timer = window.setTimeout(() => {
      setCtaVisible(true)
      setPhase('cta')
    }, 3200)
    return () => {
      window.clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
      fadeStartTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      fadeStartTimersRef.current.clear()
      removalTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      removalTimersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (rings.length === 0) return
    if (phase !== 'play') {
      rings.forEach((ring) => {
        const fadeTimer = fadeStartTimersRef.current.get(ring.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeStartTimersRef.current.delete(ring.id)
        }
        startRingFade(ring.id, controls.ringFade)
      })
    }
  }, [phase, rings, clearTimer, startRingFade, controls.ringFade])

  const handlePulse = () => {
    if (phase !== 'play') return
    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))

    const hue = Math.random()
    const spin: 1 | -1 = Math.random() > 0.5 ? 1 : -1
    const scale = 0.62 + Math.random() * 0.68
    const tone = Math.random()
    const offset = Math.random() * 360
    const drift = Math.random()
    const delay = Math.floor(Math.random() * 140)
    const ringId = Date.now() + Math.floor(Math.random() * 1000)
    const newRing: Ring = {
      id: ringId,
      hue,
      spin,
      scale,
      tone,
      offset,
      drift,
      delay,
      isFading: false,
    }

    setRings((prev) => {
      const next = [...prev, newRing]
      const overflow = next.length - MAX_RINGS
      if (overflow <= 0) return next

      const trimmed = next.slice(overflow)
      const removed = next.slice(0, overflow)
      removed.forEach((ring) => {
        const fadeTimer = fadeStartTimersRef.current.get(ring.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeStartTimersRef.current.delete(ring.id)
        }
        const removalTimer = removalTimersRef.current.get(ring.id)
        if (removalTimer !== undefined) {
          clearTimer(removalTimer)
          removalTimersRef.current.delete(ring.id)
        }
      })
      return trimmed
    })

    const holdDuration = Math.max(
      1600,
      Math.round(
        controls.ringFade * (0.9 + drift * controls.driftStrength * 0.8)
      )
    )
    const fadeTimer = registerTimer(() => {
      fadeStartTimersRef.current.delete(ringId)
      startRingFade(ringId, controls.ringFade)
    }, holdDuration)
    fadeStartTimersRef.current.set(ringId, fadeTimer)
  }

  const handleControlChange = (key: keyof ControlState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      setControls((prev) => ({
        ...prev,
        [key]: value,
      }))
    }

  return (
    <section
      className="media-full"
      role="presentation"
      aria-label="共有したメディアの記録を光の層で味わう"
    >
      <div className="media-stage" style={stageStyle} aria-hidden>
        <div className="media-stage__grid" />
        <div className="media-stage__halo" />
        <div className="media-rings">
          {[...visibleRings].reverse().map((ring, index) => {
            const hueShift = ((ring.hue - 0.5) * controls.paletteShift * 2).toFixed(2)
            const alpha = (0.54 + ring.tone * 0.4).toFixed(3)
            const scale = (ring.scale + index * 0.004).toFixed(3)
            const orbitDuration = Math.max(
              controls.rotationSpeed * (0.72 + ring.drift * 0.9),
              1600
            )
            const driftFactor = (ring.drift * controls.driftStrength).toFixed(3)

            const ringStyle = {
              '--ring-scale': scale,
              '--ring-hue': `${hueShift}deg`,
              '--ring-alpha': alpha,
              '--ring-offset': `${ring.offset.toFixed(1)}deg`,
              '--ring-drift': driftFactor,
              animationDelay: `${ring.delay}ms`,
            } as CSSProperties

            const haloStyle = {
              '--ring-orbit-duration': `${orbitDuration.toFixed(0)}ms`,
              '--ring-direction': ring.spin === -1 ? 'reverse' : 'normal',
            } as CSSProperties

            return (
              <div
                key={ring.id}
                className={`media-ring${ring.isFading ? ' is-fading' : ''}`}
                style={ringStyle}
              >
                <div className="media-ring__halo" style={haloStyle} />
                <div className="media-ring__glow" />
              </div>
            )
          })}
        </div>
        <div className="media-stage__core" />
        <div className="media-stage__dust" />
      </div>
      <TapRippleField
        disabled={phase !== 'play'}
        onPulse={handlePulse}
        variant="media"
      />

      <div className="media-count" aria-hidden>
        {formatNumber(count)}
      </div>

      <div className="media-meta" aria-hidden>
        <p>あなた → 彼女 {formatNumber(mediaExchangeCounts.fromYou)} 枚</p>
        <p>彼女 → あなた {formatNumber(mediaExchangeCounts.fromPartner)} 枚</p>
      </div>

      {phase !== 'play' && (
        <div className="media-caption" role="status">
          <p>光の層に並んだ記録が、外周へと重なっていく。</p>
          <p>ふたりで残したメディアの数だけ、輪が広がりました。</p>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <div className="media-cta">
          <button type="button" onClick={onAdvance}>
            タップで次へ
          </button>
        </div>
      )}

      <div
        className={`media-control-panel${panelOpen ? ' is-open' : ''}`}
        aria-hidden={false}
      >
        <button
          type="button"
          className="media-control-panel__toggle"
          onClick={() => setPanelOpen((prev) => !prev)}
        >
          {panelOpen ? 'close' : 'tune'}
        </button>
        <div className="media-control-panel__body">
          <label className="media-control">
            <span>Rotation speed (ms)</span>
            <input
              type="range"
              min={2600}
              max={8200}
              step={100}
              value={controls.rotationSpeed}
              onChange={handleControlChange('rotationSpeed')}
            />
            <span className="media-control__value">{controls.rotationSpeed}</span>
          </label>
          <label className="media-control">
            <span>Ring fade (ms)</span>
            <input
              type="range"
              min={2200}
              max={8800}
              step={100}
              value={controls.ringFade}
              onChange={handleControlChange('ringFade')}
            />
            <span className="media-control__value">{controls.ringFade}</span>
          </label>
          <label className="media-control">
            <span>Glow intensity</span>
            <input
              type="range"
              min={0.4}
              max={1.4}
              step={0.02}
              value={controls.glowIntensity}
              onChange={handleControlChange('glowIntensity')}
            />
            <span className="media-control__value">
              {controls.glowIntensity.toFixed(2)}
            </span>
          </label>
          <label className="media-control">
            <span>Palette shift (deg)</span>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={controls.paletteShift}
              onChange={handleControlChange('paletteShift')}
            />
            <span className="media-control__value">{controls.paletteShift}</span>
          </label>
          <label className="media-control">
            <span>Drift strength</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={controls.driftStrength}
              onChange={handleControlChange('driftStrength')}
            />
            <span className="media-control__value">
              {controls.driftStrength.toFixed(2)}
            </span>
          </label>
        </div>
      </div>
    </section>
  )
}
