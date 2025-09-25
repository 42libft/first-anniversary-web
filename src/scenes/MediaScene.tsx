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
const MAX_FRAMES = 27

type Frame = {
  id: number
  column: number
  tone: number
  tilt: number
  delay: number
  isFading: boolean
}

type ControlState = {
  scanDuration: number
  frameFade: number
  glowIntensity: number
  grainAmount: number
  paletteShift: number
}

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const MediaScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(18, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [frames, setFrames] = useState<Frame[]>([])
  const [controls, setControls] = useState<ControlState>({
    scanDuration: 3600,
    frameFade: 4600,
    glowIntensity: 0.92,
    grainAmount: 0.28,
    paletteShift: 26,
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const columnRef = useRef(0)
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

  const removeFrame = useCallback((frameId: number) => {
    setFrames((prev) => prev.filter((frame) => frame.id !== frameId))
  }, [])

  const startFrameFade = useCallback(
    (frameId: number, fadeDuration: number) => {
      let shouldScheduleRemoval = false
      setFrames((prev) => {
        let didChange = false
        const next = prev.map((frame) => {
          if (frame.id !== frameId) return frame
          if (frame.isFading) return frame
          didChange = true
          shouldScheduleRemoval = true
          return { ...frame, isFading: true }
        })
        if (!didChange) return prev
        return next
      })

      if (!shouldScheduleRemoval) {
        return
      }

      const existingRemoval = removalTimersRef.current.get(frameId)
      if (existingRemoval !== undefined) {
        clearTimer(existingRemoval)
      }
      const removalDelay = Math.max(420, fadeDuration) + 180
      const removalTimer = registerTimer(() => {
        removalTimersRef.current.delete(frameId)
        removeFrame(frameId)
      }, removalDelay)
      removalTimersRef.current.set(frameId, removalTimer)
    },
    [clearTimer, registerTimer, removeFrame]
  )

  const stageStyle = useMemo(
    () =>
      ({
        '--media-scan-duration': `${controls.scanDuration}ms`,
        '--media-frame-fade': `${controls.frameFade}ms`,
        '--media-glow-intensity': `${controls.glowIntensity}`,
        '--media-grain-amount': `${controls.grainAmount}`,
        '--media-palette-shift': `${controls.paletteShift}deg`,
      }) as CSSProperties,
    [controls]
  )

  const visibleFrames = useMemo(() => frames.slice(-MAX_FRAMES), [frames])

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
    if (frames.length === 0) return
    if (phase !== 'play') {
      frames.forEach((frame) => {
        const fadeTimer = fadeStartTimersRef.current.get(frame.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeStartTimersRef.current.delete(frame.id)
        }
        startFrameFade(frame.id, controls.frameFade)
      })
    }
  }, [phase, frames, clearTimer, startFrameFade, controls.frameFade])

  const handlePulse = () => {
    if (phase !== 'play') return
    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))

    const column = columnRef.current % 3
    columnRef.current = (columnRef.current + 1) % 3
    const tone = Math.random()
    const tilt = (Math.random() - 0.5) * 6
    const delay = Math.floor(Math.random() * 120)
    const frameId = Date.now() + Math.floor(Math.random() * 1000)
    const newFrame: Frame = {
      id: frameId,
      column,
      tone,
      tilt,
      delay,
      isFading: false,
    }

    setFrames((prev) => {
      const next = [...prev, newFrame]
      const overflow = next.length - MAX_FRAMES
      if (overflow <= 0) return next

      const trimmed = next.slice(overflow)
      const removed = next.slice(0, overflow)
      removed.forEach((frame) => {
        const fadeTimer = fadeStartTimersRef.current.get(frame.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeStartTimersRef.current.delete(frame.id)
        }
        const removalTimer = removalTimersRef.current.get(frame.id)
        if (removalTimer !== undefined) {
          clearTimer(removalTimer)
          removalTimersRef.current.delete(frame.id)
        }
      })
      return trimmed
    })

    const holdDuration = Math.max(1200, Math.round(controls.frameFade * 1.15))
    const fadeTimer = registerTimer(() => {
      fadeStartTimersRef.current.delete(frameId)
      startFrameFade(frameId, controls.frameFade)
    }, holdDuration)
    fadeStartTimersRef.current.set(frameId, fadeTimer)
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
      aria-label="共有したメディアの記録を光のフレームで味わう"
    >
      <div className="media-stage" style={stageStyle} aria-hidden>
        <div className="media-stage__grid" />
        <div className="media-sheet">
          {[...visibleFrames].reverse().map((frame, index) => {
            const hueShift = ((frame.tone - 0.5) * controls.paletteShift * 2).toFixed(2)
            const style = {
              '--frame-column': `${frame.column}`,
              '--frame-tone': `${frame.tone}`,
              '--frame-tilt': `${frame.tilt}`,
              '--frame-order': `${index}`,
              '--frame-hue': `${hueShift}deg`,
              animationDelay: `${frame.delay}ms`,
            } as CSSProperties
            return (
              <div
                key={frame.id}
                className={`media-frame${frame.isFading ? ' is-fading' : ''}`}
                style={style}
              >
                <div className="media-frame__inner" />
                <div className="media-frame__scan" />
              </div>
            )
          })}
        </div>
        <div className="media-stage__grain" />
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
          <p>すべての写真と動画が光のフィルムに焼き付いて。</p>
          <p>この数だけ、ふたりの端末を行き来しました。</p>
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
            <span>Scan duration (ms)</span>
            <input
              type="range"
              min={2200}
              max={6200}
              step={100}
              value={controls.scanDuration}
              onChange={handleControlChange('scanDuration')}
            />
            <span className="media-control__value">{controls.scanDuration}</span>
          </label>
          <label className="media-control">
            <span>Frame fade (ms)</span>
            <input
              type="range"
              min={1800}
              max={7200}
              step={100}
              value={controls.frameFade}
              onChange={handleControlChange('frameFade')}
            />
            <span className="media-control__value">{controls.frameFade}</span>
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
            <span>Grain amount</span>
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.02}
              value={controls.grainAmount}
              onChange={handleControlChange('grainAmount')}
            />
            <span className="media-control__value">
              {controls.grainAmount.toFixed(2)}
            </span>
          </label>
          <label className="media-control">
            <span>Palette shift (deg)</span>
            <input
              type="range"
              min={0}
              max={42}
              step={1}
              value={controls.paletteShift}
              onChange={handleControlChange('paletteShift')}
            />
            <span className="media-control__value">{controls.paletteShift}</span>
          </label>
        </div>
      </div>
    </section>
  )
}
