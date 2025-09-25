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
const MAX_SHARDS = 54
const MIN_OFFSET_GAP = 0.18

type Shard = {
  id: number
  x: number
  y: number
  depth: number
  scale: number
  hue: number
  tone: number
  tiltX: number
  tiltY: number
  rotateZ: number
  drift: number
  delay: number
  flight: number
  isFading: boolean
}

type ControlState = {
  flightDuration: number
  fadeDuration: number
  glowIntensity: number
  hueSpread: number
  driftStrength: number
}

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const MediaScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(18, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [shards, setShards] = useState<Shard[]>([])
  const [controls, setControls] = useState<ControlState>({
    flightDuration: 3600,
    fadeDuration: 5400,
    glowIntensity: 0.9,
    hueSpread: 36,
    driftStrength: 0.7,
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

  const removeShard = useCallback((shardId: number) => {
    setShards((prev) => prev.filter((shard) => shard.id !== shardId))
  }, [])

  const startShardFade = useCallback(
    (shardId: number, fadeDuration: number) => {
      let shouldScheduleRemoval = false
      setShards((prev) => {
        let didChange = false
        const next = prev.map((shard) => {
          if (shard.id !== shardId) return shard
          if (shard.isFading) return shard
          didChange = true
          shouldScheduleRemoval = true
          return { ...shard, isFading: true }
        })
        if (!didChange) return prev
        return next
      })

      if (!shouldScheduleRemoval) {
        return
      }

      const existingRemoval = removalTimersRef.current.get(shardId)
      if (existingRemoval !== undefined) {
        clearTimer(existingRemoval)
      }
      const removalDelay = Math.max(520, fadeDuration) + 220
      const removalTimer = registerTimer(() => {
        removalTimersRef.current.delete(shardId)
        removeShard(shardId)
      }, removalDelay)
      removalTimersRef.current.set(shardId, removalTimer)
    },
    [clearTimer, registerTimer, removeShard]
  )

  const stageStyle = useMemo(
    () =>
      ({
        '--media-flight-duration': `${controls.flightDuration}ms`,
        '--media-shard-fade': `${controls.fadeDuration}ms`,
        '--media-shard-glow': `${controls.glowIntensity}`,
        '--media-hue-spread': `${controls.hueSpread}deg`,
        '--media-drift-strength': `${controls.driftStrength}`,
      }) as CSSProperties,
    [controls]
  )

  const visibleShards = useMemo(
    () => shards.slice(-MAX_SHARDS),
    [shards]
  )

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
    if (shards.length === 0) return
    if (phase !== 'play') {
      shards.forEach((shard) => {
        const fadeTimer = fadeStartTimersRef.current.get(shard.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeStartTimersRef.current.delete(shard.id)
        }
        startShardFade(shard.id, controls.fadeDuration)
      })
    }
  }, [phase, shards, clearTimer, startShardFade, controls.fadeDuration])

  const pickOffset = useCallback((range: number, minGap: number) => {
    let value = 0
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = (Math.random() * 2 - 1) * range
      if (Math.abs(candidate) >= minGap) {
        return candidate
      }
      value = candidate
    }
    return value
  }, [])

  const handlePulse = () => {
    if (phase !== 'play') return
    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))

    const x = pickOffset(0.85, MIN_OFFSET_GAP)
    const y = pickOffset(0.6, MIN_OFFSET_GAP * 0.6)
    const depth = -120 - Math.random() * 260
    const scale = 0.58 + Math.random() * 0.62
    const hue = Math.random()
    const tone = Math.random()
    const tiltX = (Math.random() - 0.5) * 28
    const tiltY = (Math.random() - 0.5) * 36
    const rotateZ = Math.random() * 360
    const drift = Math.random()
    const delay = Math.floor(Math.random() * 120)
    const flightDuration = Math.max(
      1600,
      Math.round(controls.flightDuration * (0.85 + drift * controls.driftStrength))
    )
    const shardId = Date.now() + Math.floor(Math.random() * 1000)

    const newShard: Shard = {
      id: shardId,
      x,
      y,
      depth,
      scale,
      hue,
      tone,
      tiltX,
      tiltY,
      rotateZ,
      drift,
      delay,
      flight: flightDuration,
      isFading: false,
    }

    setShards((prev) => {
      const next = [...prev, newShard]
      const overflow = next.length - MAX_SHARDS
      if (overflow <= 0) return next

      const trimmed = next.slice(overflow)
      const removed = next.slice(0, overflow)
      removed.forEach((shard) => {
        const fadeTimer = fadeStartTimersRef.current.get(shard.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeStartTimersRef.current.delete(shard.id)
        }
        const removalTimer = removalTimersRef.current.get(shard.id)
        if (removalTimer !== undefined) {
          clearTimer(removalTimer)
          removalTimersRef.current.delete(shard.id)
        }
      })
      return trimmed
    })

    const holdDuration = flightDuration
    const fadeTimer = registerTimer(() => {
      fadeStartTimersRef.current.delete(shardId)
      startShardFade(shardId, controls.fadeDuration)
    }, holdDuration)
    fadeStartTimersRef.current.set(shardId, fadeTimer)
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
        <div className="media-stage__light" />
        <div className="media-shards">
          {[...visibleShards].reverse().map((shard, index) => {
            const hueShift = (
              (shard.hue - 0.5) * controls.hueSpread * 2
            ).toFixed(2)
            const translateX = (shard.x * 36).toFixed(2)
            const translateY = (shard.y * 32).toFixed(2)
            const depth = shard.depth.toFixed(2)
            const scale = (shard.scale + index * 0.003).toFixed(3)
            const tiltX = shard.tiltX.toFixed(2)
            const tiltY = shard.tiltY.toFixed(2)
            const rotateZ = shard.rotateZ.toFixed(2)
            const alpha = (0.38 + shard.tone * 0.38).toFixed(3)
            const driftFactor = shard.drift.toFixed(3)

            const style = {
              '--shard-translate-x': `${translateX}%`,
              '--shard-translate-y': `${translateY}%`,
              '--shard-depth': `${depth}px`,
              '--shard-scale': scale,
              '--shard-tilt-x': `${tiltX}deg`,
              '--shard-tilt-y': `${tiltY}deg`,
              '--shard-rotate-z': `${rotateZ}deg`,
              '--shard-hue': `${hueShift}deg`,
              '--shard-alpha': alpha,
              '--shard-drift': driftFactor,
              '--shard-flight': `${shard.flight}ms`,
              animationDelay: `${shard.delay}ms`,
            } as CSSProperties

            return (
              <div
                key={shard.id}
                className={`media-shard${shard.isFading ? ' is-fading' : ''}`}
                style={style}
              >
                <div className="media-shard__plane" />
                <div className="media-shard__flare" />
              </div>
            )
          })}
        </div>
        <div className="media-stage__core" />
        <div className="media-stage__particles" />
      </div>
      <TapRippleField
        disabled={phase !== 'play'}
        onPulse={handlePulse}
        variant="media"
        showRipples={false}
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
          <p>光の欠片が奥へと漂い、記録の層が増えていく。</p>
          <p>ふたりで共有したメディアの数だけ、残光が積もります。</p>
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
            <span>Flight duration (ms)</span>
            <input
              type="range"
              min={2400}
              max={8200}
              step={100}
              value={controls.flightDuration}
              onChange={handleControlChange('flightDuration')}
            />
            <span className="media-control__value">{controls.flightDuration}</span>
          </label>
          <label className="media-control">
            <span>Trail fade (ms)</span>
            <input
              type="range"
              min={2400}
              max={9200}
              step={100}
              value={controls.fadeDuration}
              onChange={handleControlChange('fadeDuration')}
            />
            <span className="media-control__value">{controls.fadeDuration}</span>
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
            <span>Hue spread (deg)</span>
            <input
              type="range"
              min={0}
              max={72}
              step={1}
              value={controls.hueSpread}
              onChange={handleControlChange('hueSpread')}
            />
            <span className="media-control__value">{controls.hueSpread}</span>
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
