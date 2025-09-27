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
import { useActionHistory } from '../history/ActionHistoryContext'

const FINAL_TARGET = totalMedia
const TAP_INCREMENT = Math.max(1, Math.ceil(FINAL_TARGET / 36))
const SCATTER_SLOT_COUNT = 160
const FRAGMENTS_PER_PULSE = 3
const PULSES_TO_GOAL = Math.max(1, Math.ceil(FINAL_TARGET / TAP_INCREMENT))
const MAX_FRAGMENTS = Math.max(72, FRAGMENTS_PER_PULSE * PULSES_TO_GOAL)
const CANVAS_RANGE_X = 0.94
const CANVAS_RANGE_Y = 0.82
const PROTECTED_RADIUS = 0.24
const SLOT_LOOKAHEAD = 18

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const clampToRange = (value: number, range: number) => clamp(value, -range, range)

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

type ScatterSlot = {
  id: number
  x: number
  y: number
  weight: number
}

type Fragment = {
  id: number
  slotId: number
  x: number
  y: number
  depth: number
  scale: number
  hue: number
  tone: number
  tiltX: number
  tiltY: number
  rotateZ: number
  initialRotateZ: number
  midRotateZ: number
  glare: number
  sheen: number
  drift: number
  delay: number
  flight: number
  launchOffsetX: number
  launchOffsetY: number
  arcOffsetX: number
  arcOffsetY: number
  launchDepth: number
  launchScale: number
  trailDelay: number
  trailScale: number
  isFading: boolean
}

type ControlState = {
  flightDuration: number
  fadeDuration: number
  glowIntensity: number
  hueSpread: number
  driftStrength: number
}

type MediaSnapshot = {
  count: number
  phase: 'play' | 'announce' | 'cta'
  ctaVisible: boolean
  controls: ControlState
  panelOpen: boolean
  fragments: Fragment[]
  waveSeed: number
  slotOrder: number[]
  slotCursor: number
}

const distanceNormalized = (a: ScatterSlot, b: { x: number; y: number }) =>
  Math.hypot((a.x - b.x) / CANVAS_RANGE_X, (a.y - b.y) / CANVAS_RANGE_Y)

const pushOutsideProtectedZone = (x: number, y: number) => {
  const distance = Math.hypot(x, y)
  if (distance === 0) {
    const angle = Math.random() * Math.PI * 2
    return pushOutsideProtectedZone(
      Math.cos(angle) * PROTECTED_RADIUS,
      Math.sin(angle) * PROTECTED_RADIUS
    )
  }

  if (distance < PROTECTED_RADIUS) {
    const scale = (PROTECTED_RADIUS + 0.04) / distance
    const scaledX = clampToRange(x * scale, CANVAS_RANGE_X)
    const scaledY = clampToRange(y * scale, CANVAS_RANGE_Y)
    return { x: scaledX, y: scaledY }
  }

  return {
    x: clampToRange(x, CANVAS_RANGE_X),
    y: clampToRange(y, CANVAS_RANGE_Y),
  }
}

const shuffle = <T,>(input: T[]) => {
  const array = [...input]
  for (let index = array.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[target]] = [array[target], array[index]]
  }
  return array
}

const generateScatterSlots = (count: number) => {
  const slots: ScatterSlot[] = []
  let minDistance = 0.26
  let attempts = 0
  const maxAttempts = count * 240

  while (slots.length < count && attempts < maxAttempts) {
    attempts += 1
    const rawX = (Math.random() * 2 - 1) * CANVAS_RANGE_X
    const rawY = (Math.random() * 2 - 1) * CANVAS_RANGE_Y
    const { x, y } = pushOutsideProtectedZone(rawX, rawY)

    const tooClose = slots.some((slot) => distanceNormalized(slot, { x, y }) < minDistance)
    if (!tooClose) {
      slots.push({ id: slots.length, x, y, weight: Math.random() })
      continue
    }

    if (attempts % (count * 4) === 0 && minDistance > 0.14) {
      minDistance *= 0.92
    }
  }

  if (slots.length < count) {
    while (slots.length < count) {
      const rawX = (Math.random() * 2 - 1) * CANVAS_RANGE_X
      const rawY = (Math.random() * 2 - 1) * CANVAS_RANGE_Y
      const { x, y } = pushOutsideProtectedZone(rawX, rawY)
      slots.push({ id: slots.length, x, y, weight: Math.random() })
    }
  }

  return slots
}

export const MediaScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(18, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [controls, setControls] = useState<ControlState>({
    flightDuration: 3600,
    fadeDuration: 5400,
    glowIntensity: 0.9,
    hueSpread: 36,
    driftStrength: 0.7,
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const [fragments, setFragments] = useState<Fragment[]>([])
  const [waveSeed, setWaveSeed] = useState(() => Math.random())
  const scatterSlots = useMemo(() => generateScatterSlots(SCATTER_SLOT_COUNT), [])
  const slotOrderRef = useRef<number[]>([])
  const slotCursorRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const fadeTimersRef = useRef<Map<number, number>>(new Map())
  const removalTimersRef = useRef<Map<number, number>>(new Map())
  const { record } = useActionHistory()

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

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
    fadeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    fadeTimersRef.current.clear()
    removalTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    removalTimersRef.current.clear()
  }, [])

  const snapshotState = useCallback((): MediaSnapshot => ({
    count,
    phase,
    ctaVisible,
    controls: { ...controls },
    panelOpen,
    fragments: fragments.map((fragment) => ({ ...fragment })),
    waveSeed,
    slotOrder: [...slotOrderRef.current],
    slotCursor: slotCursorRef.current,
  }), [controls, count, ctaVisible, fragments, panelOpen, phase, waveSeed])

  const restoreSnapshot = useCallback((snapshot: MediaSnapshot) => {
    clearAllTimers()
    setCount(snapshot.count)
    setPhase(snapshot.phase)
    setCtaVisible(snapshot.ctaVisible)
    setControls(snapshot.controls)
    setPanelOpen(snapshot.panelOpen)
    setFragments(snapshot.fragments)
    setWaveSeed(snapshot.waveSeed)
    slotOrderRef.current = [...snapshot.slotOrder]
    slotCursorRef.current = snapshot.slotCursor
  }, [
    clearAllTimers,
    setControls,
    setCount,
    setCtaVisible,
    setFragments,
    setPanelOpen,
    setPhase,
    setWaveSeed,
  ])

  const resetSlotOrder = useCallback(() => {
    const indices = Array.from({ length: scatterSlots.length }, (_, index) => index)
    slotOrderRef.current = shuffle(indices)
    slotCursorRef.current = 0
  }, [scatterSlots.length])

  useEffect(() => {
    resetSlotOrder()
  }, [resetSlotOrder])

  useEffect(() => () => clearAllTimers(), [clearAllTimers])

  const visibleFragments = useMemo(
    () => fragments.slice(-MAX_FRAGMENTS),
    [fragments]
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
    const timer = registerTimer(() => {
      setCtaVisible(true)
      setPhase('cta')
    }, 3200)
    return () => clearTimer(timer)
  }, [clearTimer, phase, registerTimer])

  const startFragmentFade = useCallback(
    (fragmentId: number, fadeDuration: number) => {
      let shouldScheduleRemoval = false
      setFragments((prev) => {
        let didChange = false
        const next = prev.map((fragment) => {
          if (fragment.id !== fragmentId) return fragment
          if (fragment.isFading) return fragment
          didChange = true
          shouldScheduleRemoval = true
          return { ...fragment, isFading: true }
        })
        if (!didChange) return prev
        return next
      })

      if (!shouldScheduleRemoval) {
        return
      }

      const existingRemoval = removalTimersRef.current.get(fragmentId)
      if (existingRemoval !== undefined) {
        clearTimer(existingRemoval)
      }
      const removalDelay = Math.max(520, fadeDuration) + 240
      const removalTimer = registerTimer(() => {
        removalTimersRef.current.delete(fragmentId)
        setFragments((prev) => prev.filter((fragment) => fragment.id !== fragmentId))
      }, removalDelay)
      removalTimersRef.current.set(fragmentId, removalTimer)
    },
    [clearTimer, registerTimer]
  )

  useEffect(() => {
    if (phase === 'play') return
    if (visibleFragments.length === 0) return
    fadeTimersRef.current.forEach((timerId) => {
      clearTimer(timerId)
    })
    fadeTimersRef.current.clear()
    visibleFragments.forEach((fragment) => {
      startFragmentFade(fragment.id, controls.fadeDuration)
    })
  }, [phase, visibleFragments, clearTimer, startFragmentFade, controls.fadeDuration])

  const pickScatterSlot = useCallback(
    (anchor?: { x: number; y: number }) => {
      if (scatterSlots.length === 0) {
        return { id: -1, x: 0, y: 0, weight: 0 }
      }

      if (slotCursorRef.current >= slotOrderRef.current.length) {
        resetSlotOrder()
      }

      const remaining = slotOrderRef.current.length - slotCursorRef.current
      const span = Math.min(SLOT_LOOKAHEAD, remaining)
      let chosenOffset = 0

      if (anchor) {
        let bestScore = Number.NEGATIVE_INFINITY
        for (let offset = 0; offset < span; offset += 1) {
          const slotIndex = slotOrderRef.current[slotCursorRef.current + offset]
          const slot = scatterSlots[slotIndex]
          const distance = Math.hypot(
            (slot.x - anchor.x) / CANVAS_RANGE_X,
            (slot.y - anchor.y) / CANVAS_RANGE_Y
          )
          const score = -distance + slot.weight * 0.22 - offset * 0.018 + (Math.random() - 0.5) * 0.04
          if (score > bestScore) {
            bestScore = score
            chosenOffset = offset
          }
        }
      } else {
        chosenOffset = Math.floor(Math.random() * span)
      }

      const targetIndex = slotCursorRef.current + chosenOffset
      const slotIndex = slotOrderRef.current[targetIndex]

      ;[slotOrderRef.current[targetIndex], slotOrderRef.current[slotCursorRef.current]] = [
        slotOrderRef.current[slotCursorRef.current],
        slotOrderRef.current[targetIndex],
      ]

      const slot = scatterSlots[slotIndex]
      slotCursorRef.current += 1

      if (slotCursorRef.current >= slotOrderRef.current.length) {
        resetSlotOrder()
      }

      return slot
    },
    [scatterSlots, resetSlotOrder]
  )

  const stageStyle = useMemo(
    () =>
      ({
        '--media-flight-duration': `${controls.flightDuration}ms`,
        '--media-fragment-fade': `${controls.fadeDuration}ms`,
        '--media-fragment-glow': controls.glowIntensity.toFixed(2),
        '--media-hue-spread': `${controls.hueSpread}deg`,
        '--media-drift-strength': controls.driftStrength.toFixed(2),
        '--media-wave-seed': waveSeed.toFixed(4),
      }) as CSSProperties,
    [controls, waveSeed]
  )

  const handlePulse = (position?: { x: number; y: number }) => {
    if (phase !== 'play') return
    const snapshot = snapshotState()
    record(() => restoreSnapshot(snapshot), { label: 'Media: pulse tap' })
    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))

    const anchorCandidate = position
      ? {
          x: (position.x - 0.5) * 2 * CANVAS_RANGE_X,
          y: (position.y - 0.5) * 2 * CANVAS_RANGE_Y,
        }
      : undefined

    const anchorDistance = anchorCandidate ? Math.hypot(anchorCandidate.x, anchorCandidate.y) : Infinity
    const anchor = anchorDistance > PROTECTED_RADIUS + 0.02 ? anchorCandidate : undefined

    const createdAt = Date.now()
    const bundle: Fragment[] = []

    for (let index = 0; index < FRAGMENTS_PER_PULSE; index += 1) {
      const slot = pickScatterSlot(index === 0 ? anchor : undefined)
      const jitterStrength = anchor ? 0.22 : 0.34
      const jitterAngle = Math.random() * Math.PI * 2
      const jitterRadius = Math.random() * jitterStrength
      const jitteredX = slot.x + Math.cos(jitterAngle) * jitterRadius * CANVAS_RANGE_X * 0.35
      const jitteredY = slot.y + Math.sin(jitterAngle) * jitterRadius * CANVAS_RANGE_Y * 0.35
      const { x, y } = pushOutsideProtectedZone(jitteredX, jitteredY)

      const depth = -120 - Math.random() * 220
      const scale = 0.56 + Math.random() * 0.6
      const hue = Math.random()
      const tone = Math.random()
      const tiltX = (Math.random() - 0.5) * 32
      const tiltY = (Math.random() - 0.5) * 38
      const rotateZ = Math.random() * 360
      const spin = (Math.random() - 0.5) * 54
      const initialRotateZ = rotateZ + spin
      const midRotateZ = rotateZ + spin * 0.45
      const glare = 0.38 + Math.random() * 0.42
      const sheen = 0.22 + Math.random() * 0.5
      const drift = Math.random()
      const delay = Math.floor(Math.random() * 160)
      const flight = Math.max(
        1800,
        Math.round(controls.flightDuration * (0.88 + drift * controls.driftStrength * 0.6))
      )
      const launchOffsetX = (Math.random() - 0.5) * 18
      const launchOffsetY = 12 + Math.random() * 14
      const arcOffsetX = (Math.random() - 0.5) * 12
      const arcOffsetY = -(6 + Math.random() * 14)
      const launchDepth = 180 + Math.random() * 160
      const launchScale = 0.58 + Math.random() * 0.18
      const trailDelay = Math.floor(Math.random() * 240)
      const trailScale = 0.82 + Math.random() * 0.5

      bundle.push({
        id: createdAt + index + Math.floor(Math.random() * 1000),
        slotId: slot.id,
        x,
        y,
        depth,
        scale,
        hue,
        tone,
        tiltX,
        tiltY,
        rotateZ,
        initialRotateZ,
        midRotateZ,
        glare,
        sheen,
        drift,
        delay,
        flight,
        launchOffsetX,
        launchOffsetY,
        arcOffsetX,
        arcOffsetY,
        launchDepth,
        launchScale,
        trailDelay,
        trailScale,
        isFading: false,
      })
    }

    setFragments((prev) => {
      const next = [...prev, ...bundle]
      if (next.length <= MAX_FRAGMENTS) {
        return next
      }
      const overflow = next.length - MAX_FRAGMENTS
      const trimmed = next.slice(overflow)
      const removed = next.slice(0, overflow)
      removed.forEach((fragment) => {
        const fadeTimer = fadeTimersRef.current.get(fragment.id)
        if (fadeTimer !== undefined) {
          clearTimer(fadeTimer)
          fadeTimersRef.current.delete(fragment.id)
        }
        const removalTimer = removalTimersRef.current.get(fragment.id)
        if (removalTimer !== undefined) {
          clearTimer(removalTimer)
          removalTimersRef.current.delete(fragment.id)
        }
      })
      return trimmed
    })

    bundle.forEach((fragment) => {
      const holdDuration = fragment.flight
      const fadeTimer = registerTimer(() => {
        fadeTimersRef.current.delete(fragment.id)
        startFragmentFade(fragment.id, controls.fadeDuration)
      }, holdDuration)
      fadeTimersRef.current.set(fragment.id, fadeTimer)
    })

    setWaveSeed((prev) => prev + 0.28)
  }

  const handleControlChange = (key: keyof ControlState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      const snapshot = snapshotState()
      record(() => restoreSnapshot(snapshot), { label: `Media: adjust ${key}` })
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
      <div
        className={`media-stage${phase !== 'play' ? ' is-paused' : ''}`}
        style={stageStyle}
        aria-hidden
      >
        <div className="media-canvas">
          <div className="media-canvas__halo" />
          <div className="media-canvas__mesh" />
          <div className="media-canvas__sheen" />
          <div className="media-fragments">
            {[...visibleFragments].reverse().map((fragment, index) => {
              const translateX = ((fragment.x / CANVAS_RANGE_X) * 50).toFixed(2)
              const translateY = ((fragment.y / CANVAS_RANGE_Y) * 50).toFixed(2)
              const depth = fragment.depth.toFixed(2)
              const scale = (fragment.scale + index * 0.004).toFixed(3)
              const tiltX = fragment.tiltX.toFixed(2)
              const tiltY = fragment.tiltY.toFixed(2)
              const rotateZ = fragment.rotateZ.toFixed(2)
              const hueShift = ((fragment.hue - 0.5) * controls.hueSpread * 2).toFixed(2)
              const distanceFactor = Math.hypot(
                (fragment.x / CANVAS_RANGE_X) * 0.8,
                (fragment.y / CANVAS_RANGE_Y) * 1.06
              )
              const visibility = clamp(1 - Math.max(0, 0.26 - distanceFactor) / 0.26, 0.34, 1)
              const alpha = ((0.36 + fragment.tone * 0.42) * visibility).toFixed(3)
              const glare = fragment.glare.toFixed(3)
              const sheen = fragment.sheen.toFixed(3)
              const drift = fragment.drift.toFixed(3)
              const launchOffsetX = fragment.launchOffsetX.toFixed(2)
              const launchOffsetY = fragment.launchOffsetY.toFixed(2)
              const arcOffsetX = fragment.arcOffsetX.toFixed(2)
              const arcOffsetY = fragment.arcOffsetY.toFixed(2)
              const launchDepth = fragment.launchDepth.toFixed(2)
              const launchScale = fragment.launchScale.toFixed(3)
              const rotateInitial = fragment.initialRotateZ.toFixed(2)
              const rotateMid = fragment.midRotateZ.toFixed(2)
              const trailScale = fragment.trailScale.toFixed(3)

              const style = {
                '--fragment-translate-x': `${translateX}vw`,
                '--fragment-translate-y': `${translateY}vh`,
                '--fragment-depth': `${depth}px`,
                '--fragment-scale': scale,
                '--fragment-tilt-x': `${tiltX}deg`,
                '--fragment-tilt-y': `${tiltY}deg`,
                '--fragment-rotate-z': `${rotateZ}deg`,
                '--fragment-rotate-initial': `${rotateInitial}deg`,
                '--fragment-rotate-mid': `${rotateMid}deg`,
                '--fragment-hue': `${hueShift}deg`,
                '--fragment-alpha': alpha,
                '--fragment-glare': glare,
                '--fragment-sheen': sheen,
                '--fragment-drift': drift,
                '--fragment-flight': `${fragment.flight}ms`,
                '--fragment-launch-x-offset': `${launchOffsetX}vw`,
                '--fragment-launch-y-offset': `${launchOffsetY}vh`,
                '--fragment-arc-x-offset': `${arcOffsetX}vw`,
                '--fragment-arc-y-offset': `${arcOffsetY}vh`,
                '--fragment-launch-depth': `${launchDepth}px`,
                '--fragment-launch-scale': launchScale,
                '--fragment-trail-delay': `${fragment.trailDelay}ms`,
                '--fragment-trail-scale': trailScale,
                '--fragment-delay': `${fragment.delay}ms`,
                animationDelay: `${fragment.delay}ms`,
              } as CSSProperties

              return (
                <div
                  key={fragment.id}
                  className={`media-fragment${fragment.isFading ? ' is-fading' : ''}`}
                  style={style}
                >
                  <span className="media-fragment__glow" />
                  <span className="media-fragment__plane" />
                </div>
              )
            })}
          </div>
          <div className="media-canvas__ring" />
        </div>
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
          <p>一年間で送りあったメディアは</p>
          <p>全部でこの数になりました</p>
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
          onClick={() => {
            const snapshot = snapshotState()
            record(() => restoreSnapshot(snapshot), { label: 'Media: toggle panel' })
            setPanelOpen((prev) => !prev)
          }}
        >
          {panelOpen ? 'close' : 'tune'}
        </button>
        <div className="media-control-panel__body">
          <label className="media-control">
            <span>Flight cycle (ms)</span>
            <input
              type="range"
              min={2600}
              max={8200}
              step={100}
              value={controls.flightDuration}
              onChange={handleControlChange('flightDuration')}
            />
            <span className="media-control__value">{controls.flightDuration}</span>
          </label>
          <label className="media-control">
            <span>Fade duration (ms)</span>
            <input
              type="range"
              min={2200}
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
