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
const NODE_COUNT = 96
const SPARKS_PER_PULSE = 14
const MAX_ACTIVE_SPARKS = 120
const CANVAS_RANGE_X = 0.94
const CANVAS_RANGE_Y = 0.82
const PROTECTED_RADIUS = 0.24

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const clampToRange = (value: number, range: number) => clamp(value, -range, range)

const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

const halton = (index: number, base: number) => {
  let result = 0
  let f = 1 / base
  let i = index

  while (i > 0) {
    result += f * (i % base)
    i = Math.floor(i / base)
    f /= base
  }

  return result
}

const pushOutsideProtectedZone = (x: number, y: number) => {
  const distance = Math.hypot(x, y)
  if (distance === 0) {
    const angle = Math.random() * Math.PI * 2
    return pushOutsideProtectedZone(Math.cos(angle) * PROTECTED_RADIUS, Math.sin(angle) * PROTECTED_RADIUS)
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

type NodeSample = {
  id: number
  x: number
  y: number
  depth: number
  size: number
  hue: number
  twinkle: number
  orbit: number
  delay: number
}

type Spark = {
  id: number
  x: number
  y: number
  depth: number
  size: number
  hue: number
  life: number
  delay: number
}

type ControlState = {
  flightDuration: number
  fadeDuration: number
  glowIntensity: number
  hueSpread: number
  driftStrength: number
}

const createNodes = (count: number) => {
  const nodes: NodeSample[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let index = 0; index < count; index += 1) {
    const t = index + 1
    const radius = Math.pow(t / count, 0.6)
    const angle = index * goldenAngle
    const offsetX = Math.cos(angle) * CANVAS_RANGE_X * lerp(0.68, 1, Math.random()) * radius
    const offsetY = Math.sin(angle) * CANVAS_RANGE_Y * lerp(0.68, 1, Math.random()) * radius
    const { x, y } = pushOutsideProtectedZone(offsetX, offsetY)
    const depth = -140 - Math.random() * 160
    const size = 0.54 + Math.random() * 0.92
    const hue = halton(index + 11, 7)
    const twinkle = 0.5 + Math.random() * 0.9
    const orbit = 0.35 + Math.random() * 0.65
    const delay = Math.floor(Math.random() * 3600)

    nodes.push({ id: index, x, y, depth, size, hue, twinkle, orbit, delay })
  }

  return nodes
}

const selectNodesForPulse = (
  nodes: NodeSample[],
  anchor: { x: number; y: number } | undefined,
  count: number
) => {
  const scored = nodes.map((node) => {
    const dx = anchor ? node.x - anchor.x : node.x * 0.54
    const dy = anchor ? node.y - anchor.y : node.y * 0.42
    const normalizedDx = dx / CANVAS_RANGE_X
    const normalizedDy = dy / CANVAS_RANGE_Y
    const distance = Math.hypot(normalizedDx, normalizedDy)
    const proximity = Math.exp(-(distance * (anchor ? 2.6 : 1.4)))
    const edgeDistance = Math.min(1, Math.hypot(node.x / CANVAS_RANGE_X, node.y / CANVAS_RANGE_Y))
    const edge = 0.28 + Math.pow(1 - edgeDistance, 1.8) * 0.62
    const noise = 0.28 + Math.random() * 0.44
    const score = Math.max(proximity * 0.72 + edge * 0.18 + noise * 0.1, 0.0001)
    return { node, score }
  })

  const pool = [...scored]
  const selected: NodeSample[] = []

  while (selected.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.score, 0)
    let target = Math.random() * total
    let chosenIndex = 0
    for (let index = 0; index < pool.length; index += 1) {
      target -= pool[index]?.score ?? 0
      if (target <= 0) {
        chosenIndex = index
        break
      }
    }
    const [entry] = pool.splice(chosenIndex, 1)
    selected.push(entry.node)
  }

  return selected
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
  const nodes = useMemo(() => createNodes(NODE_COUNT), [])
  const [sparks, setSparks] = useState<Spark[]>([])
  const [waveSeed, setWaveSeed] = useState(() => Math.random())
  const timersRef = useRef<number[]>([])
  const sparkRemovalTimersRef = useRef<Map<number, number>>(new Map())

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

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
      sparkRemovalTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      sparkRemovalTimersRef.current.clear()
    }
  }, [])

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
    if (phase === 'play') return
    if (sparks.length === 0) return
    sparkRemovalTimersRef.current.forEach((timerId) => {
      clearTimer(timerId)
    })
    sparkRemovalTimersRef.current.clear()
    setSparks([])
  }, [phase, sparks.length, clearTimer])

  const stageStyle = useMemo(
    () =>
      ({
        '--media-wave-cycle': `${controls.flightDuration}ms`,
        '--media-spark-fade': `${controls.fadeDuration}ms`,
        '--media-glow-strength': controls.glowIntensity.toFixed(2),
        '--media-hue-spread': `${controls.hueSpread}deg`,
        '--media-drift-strength': controls.driftStrength.toFixed(2),
        '--media-wave-seed': waveSeed.toFixed(4),
      }) as CSSProperties,
    [controls, waveSeed]
  )

  const handlePulse = (position?: { x: number; y: number }) => {
    if (phase !== 'play') return
    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))

    const anchorCandidate = position
      ? {
          x: (position.x - 0.5) * 2 * CANVAS_RANGE_X,
          y: (position.y - 0.5) * 2 * CANVAS_RANGE_Y,
        }
      : undefined
    const anchorDistance = anchorCandidate ? Math.hypot(anchorCandidate.x, anchorCandidate.y) : Infinity
    const anchor = anchorDistance > PROTECTED_RADIUS + 0.02 ? anchorCandidate : undefined

    const selectedNodes = selectNodesForPulse(nodes, anchor, SPARKS_PER_PULSE)
    const now = Date.now()

    const additions = selectedNodes.map((node, index) => {
      const scaleJitter = 0.9 + Math.random() * 0.8
      const life = Math.round(Math.max(2000, controls.fadeDuration * (0.74 + Math.random() * 0.48)))
      const delay = Math.floor(Math.random() * 160)
      return {
        id: now + index + Math.floor(Math.random() * 1000),
        x: clampToRange(node.x * (0.86 + Math.random() * 0.22), CANVAS_RANGE_X),
        y: clampToRange(node.y * (0.86 + Math.random() * 0.22), CANVAS_RANGE_Y),
        depth: node.depth + Math.random() * 120 - 60,
        size: node.size * scaleJitter,
        hue: node.hue + (Math.random() - 0.5) * 0.18,
        life,
        delay,
      }
    })

    setSparks((prev) => {
      const merged = [...prev, ...additions]
      if (merged.length <= MAX_ACTIVE_SPARKS) {
        return merged
      }
      const overflow = merged.length - MAX_ACTIVE_SPARKS
      const trimmed = merged.slice(overflow)
      const removed = merged.slice(0, overflow)
      removed.forEach((spark) => {
        const timerId = sparkRemovalTimersRef.current.get(spark.id)
        if (timerId !== undefined) {
          clearTimer(timerId)
          sparkRemovalTimersRef.current.delete(spark.id)
        }
      })
      return trimmed
    })

    additions.forEach((spark) => {
      const timer = registerTimer(() => {
        setSparks((current) => current.filter((item) => item.id !== spark.id))
        sparkRemovalTimersRef.current.delete(spark.id)
      }, spark.life + spark.delay)
      sparkRemovalTimersRef.current.set(spark.id, timer)
    })

    setWaveSeed((prev) => prev + 0.35)
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
      <div
        className={`media-stage${phase !== 'play' ? ' is-paused' : ''}`}
        style={stageStyle}
        aria-hidden
      >
        <div className="media-canvas">
          <div className="media-canvas__halo" />
          <div className="media-canvas__mesh" />
          <div className="media-canvas__sheen" />
          <div className="media-nodes">
            {nodes.map((node) => {
              const translateX = ((node.x / CANVAS_RANGE_X) * 46).toFixed(2)
              const translateY = ((node.y / CANVAS_RANGE_Y) * 46).toFixed(2)
              const nodeStyle = {
                '--node-translate-x': `${translateX}%`,
                '--node-translate-y': `${translateY}%`,
                '--node-depth': `${node.depth.toFixed(2)}px`,
                '--node-scale': node.size.toFixed(3),
                '--node-hue': `${((node.hue - 0.5) * controls.hueSpread * 2).toFixed(2)}deg`,
                '--node-twinkle': node.twinkle.toFixed(2),
                '--node-orbit': node.orbit.toFixed(2),
              } as CSSProperties
              const nodeAnimationDelay = `${node.delay}ms, ${Math.floor(node.delay * 0.6)}ms`
              const pulseDelay = `${Math.floor(node.delay * 0.45)}ms`

              return (
                <div
                  key={node.id}
                  className="media-node"
                  style={{ ...nodeStyle, animationDelay: nodeAnimationDelay }}
                >
                  <span className="media-node__pulse" style={{ animationDelay: pulseDelay }} />
                  <span className="media-node__core" />
                </div>
              )
            })}
          </div>
          <div className="media-sparks">
            {sparks.map((spark) => {
              const translateX = ((spark.x / CANVAS_RANGE_X) * 46).toFixed(2)
              const translateY = ((spark.y / CANVAS_RANGE_Y) * 46).toFixed(2)
              const sparkStyle = {
                '--spark-translate-x': `${translateX}%`,
                '--spark-translate-y': `${translateY}%`,
                '--spark-depth': `${spark.depth.toFixed(2)}px`,
                '--spark-scale': spark.size.toFixed(3),
                '--spark-hue': `${((spark.hue - 0.5) * controls.hueSpread * 2).toFixed(2)}deg`,
                animationDuration: `${spark.life}ms`,
                animationDelay: `${spark.delay}ms`,
              } as CSSProperties

              return (
                <div key={spark.id} className="media-spark" style={sparkStyle}>
                  <span className="media-spark__flare" />
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
          <p>光のレイヤーが奥へと折り重なり、記録の余韻が広がる。</p>
          <p>ふたりで共有したメディアが、星の記憶として残ります。</p>
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
            <span>Wave cycle (ms)</span>
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
            <span>Spark fade (ms)</span>
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
