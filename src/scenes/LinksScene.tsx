import {
  type CSSProperties,
  type PointerEvent,
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { linkExchangeCounts, totalLinks } from '../data/links'
import type { SceneComponentProps } from '../types/scenes'

const FINAL_TARGET = totalLinks
const TAP_INCREMENT = Math.max(1, Math.ceil(FINAL_TARGET / 32))
const STRONG_SEGMENT_LIFETIME = 4200
const SOFT_SEGMENT_LIFETIME = 1400
const STRONG_FADE_DELAY = 3000
const SOFT_FADE_DELAY = 720
const MAX_SEGMENTS = 32

type ControlState = {
  intensity: number
  softDuration: number
  strongDuration: number
  nodeRadius: number
  thickness: number
}

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

const STATIC_NODES = [
  { id: 'n1', cx: 12, cy: 26 },
  { id: 'n2', cx: 22, cy: 62 },
  { id: 'n3', cx: 38, cy: 18 },
  { id: 'n4', cx: 48, cy: 44 },
  { id: 'n5', cx: 60, cy: 16 },
  { id: 'n6', cx: 70, cy: 58 },
  { id: 'n7', cx: 82, cy: 30 },
  { id: 'n8', cx: 30, cy: 78 },
  { id: 'n9', cx: 58, cy: 78 },
  { id: 'n10', cx: 86, cy: 70 },
] as const

const STATIC_EDGES: Array<[number, number]> = [
  [0, 2],
  [2, 4],
  [4, 6],
  [0, 3],
  [3, 5],
  [5, 7],
  [7, 9],
  [1, 3],
  [1, 8],
  [8, 5],
  [2, 5],
  [5, 9],
]

type Node = { id: string; cx: number; cy: number }

type Segment = {
  id: number
  batch: number
  startX: number
  startY: number
  endX: number
  endY: number
  delay: number
  isStrong: boolean
  length: number
  isFading: boolean
}

export const LinksScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(10, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [showLines, setShowLines] = useState(false)
  const [dynamicNodes, setDynamicNodes] = useState<Node[]>([])
  const [dynamicEdges, setDynamicEdges] = useState<Array<[number, number]>>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set())
  const [controls, setControls] = useState<ControlState>({
    intensity: 1.6,
    softDuration: 600,
    strongDuration: 600,
    nodeRadius: 0.5,
    thickness: 0.9,
  })
  const [panelOpen, setPanelOpen] = useState(false)
  const networkRef = useRef<SVGSVGElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const batchRef = useRef(0)
  const timersRef = useRef<number[]>([])

  const allNodes = useMemo<Node[]>(
    () => [...STATIC_NODES, ...dynamicNodes],
    [dynamicNodes]
  )

  const edges = useMemo<Array<[number, number]>>(
    () => [...STATIC_EDGES, ...dynamicEdges],
    [dynamicEdges]
  )

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
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
    setShowLines(false)
    setCtaVisible(false)
    const timerLine = window.setTimeout(() => setShowLines(true), 900)
    const timerCta = window.setTimeout(() => {
      setCtaVisible(true)
      setPhase('cta')
    }, 3600)
    return () => {
      window.clearTimeout(timerLine)
      window.clearTimeout(timerCta)
    }
  }, [phase])

  const toViewBoxPoint = (event: PointerEvent<HTMLDivElement>) => {
    if (!networkRef.current) return null
    const svg = networkRef.current
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const svgPoint = point.matrixTransform(ctm.inverse())
    return { x: svgPoint.x, y: svgPoint.y }
  }

  const handleTap = (event: PointerEvent<HTMLDivElement>) => {
    if (phase !== 'play') return
    const svgPoint = toViewBoxPoint(event)
    if (!svgPoint) return

    batchRef.current += 1
    const batchId = batchRef.current

    const distanceList = allNodes.map((node, index) => ({
      index,
      distance: Math.hypot(svgPoint.x - node.cx, svgPoint.y - node.cy),
    }))
    distanceList.sort((a, b) => a.distance - b.distance)
    const nearestIndices = distanceList.slice(0, Math.min(3, distanceList.length))

    const newNodeIndex = STATIC_NODES.length + dynamicNodes.length
    const newNodeId = `c${Date.now()}`
    const newNode: Node = { id: newNodeId, cx: svgPoint.x, cy: svgPoint.y }
    const newEdges: Array<[number, number]> = nearestIndices.map((item) => [
      newNodeIndex,
      item.index,
    ])

    setDynamicNodes((prev) => [...prev, newNode])
    setDynamicEdges((prev) => [...prev, ...newEdges])

    const newSegments: Segment[] = []
    nearestIndices.forEach((entry, idx) => {
      const target = allNodes[entry.index]
      if (!target) return
      const isStrong = idx === 0
      newSegments.push(
        createSegment(
          batchId,
          idx,
          { x: newNode.cx, y: newNode.cy },
          { x: target.cx, y: target.cy },
          isStrong
        )
      )

      setActiveNodes((prev) => {
        const next = new Set(prev)
        next.add(target.id)
        return next
      })
      window.setTimeout(() => {
        setActiveNodes((prev) => {
          const next = new Set(prev)
          next.delete(target.id)
          return next
        })
      }, 1400 + idx * 160)
    })

    setActiveNodes((prev) => {
      const next = new Set(prev)
      next.add(newNodeId)
      return next
    })
    window.setTimeout(() => {
      setActiveNodes((prev) => {
        const next = new Set(prev)
        next.delete(newNodeId)
        return next
      })
    }, 1800)

    setSegments((prev) => {
      const merged = [...prev, ...newSegments]
      if (merged.length <= MAX_SEGMENTS) return merged
      return merged.slice(merged.length - MAX_SEGMENTS)
    })

    newSegments.forEach((segment) => {
      const lifetime = segment.isStrong
        ? STRONG_SEGMENT_LIFETIME
        : SOFT_SEGMENT_LIFETIME
      const fadeDelay = segment.isStrong ? STRONG_FADE_DELAY : SOFT_FADE_DELAY

      const fadeTimer = window.setTimeout(() => {
        setSegments((prev) =>
          prev.map((item) =>
            item.id === segment.id ? { ...item, isFading: true } : item
          )
        )
      }, Math.max(120, Math.min(fadeDelay, Math.max(0, lifetime - 180))))

      const removalTimer = window.setTimeout(() => {
        setSegments((prev) => prev.filter((item) => item.id !== segment.id))
      }, lifetime)

      timersRef.current.push(fadeTimer, removalTimer)
    })

    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))
    event.preventDefault()
  }

  const handleControlChange = (key: keyof ControlState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      setControls((prev) => ({
        ...prev,
        [key]: value,
      }))
    }

  const stageStyle = useMemo(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value))
    const softOpacityStart = clamp(0.62 * controls.intensity, 0.05, 1)
    const softOpacityMid = clamp(0.55 * controls.intensity, 0.04, 0.9)
    const softOpacityLate = clamp(0.34 * controls.intensity, 0.03, 0.7)
    const softOpacityEnd = 0
    const strongOpacityStart = clamp(0.74 * controls.intensity, 0.05, 1)
    const strongOpacityMid = clamp(0.62 * controls.intensity, 0.05, 0.95)
    const strongOpacityLate = clamp(0.48 * controls.intensity, 0.08, 0.92)
    const strongOpacityEnd = clamp(0.42 * controls.intensity, 0.12, 0.88)
    const strongThickness = clamp(controls.thickness * 1.22, 0.3, 1.4)

    return {
      '--links-spark-soft-duration': `${controls.softDuration}ms`,
      '--links-spark-strong-duration': `${controls.strongDuration}ms`,
      '--links-spark-soft-width': controls.thickness,
      '--links-spark-strong-width': Number(strongThickness.toFixed(2)),
      '--links-spark-soft-opacity-start': softOpacityStart,
      '--links-spark-soft-opacity-mid': softOpacityMid,
      '--links-spark-soft-opacity-late': softOpacityLate,
      '--links-spark-soft-opacity-end': softOpacityEnd,
      '--links-spark-strong-opacity-start': strongOpacityStart,
      '--links-spark-strong-opacity-mid': strongOpacityMid,
      '--links-spark-strong-opacity-late': strongOpacityLate,
      '--links-spark-strong-opacity-end': strongOpacityEnd,
    } as CSSProperties
  }, [controls])

  return (
    <section
      className="links-full"
      role="presentation"
      aria-label="共有したリンクの記録をネットワークの光で振り返る"
    >
      <div
        ref={stageRef}
        className="links-stage"
        style={stageStyle}
        aria-hidden
        onPointerDown={handleTap}
      >
        <svg ref={networkRef} className="links-network" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="links-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(96, 226, 255, 0.72)" />
              <stop offset="46%" stopColor="rgba(56, 156, 230, 0.42)" />
              <stop offset="100%" stopColor="rgba(18, 60, 120, 0.18)" />
            </linearGradient>
            <linearGradient id="links-spark-strong" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.98)" />
              <stop offset="14%" stopColor="rgba(224, 250, 255, 0.96)" />
              <stop offset="48%" stopColor="rgba(142, 232, 255, 0.82)" />
              <stop offset="82%" stopColor="rgba(58, 190, 255, 0.48)" />
              <stop offset="100%" stopColor="rgba(24, 80, 138, 0.05)" />
            </linearGradient>
            <linearGradient id="links-spark-soft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(186, 236, 255, 0.72)" />
              <stop offset="55%" stopColor="rgba(122, 210, 255, 0.46)" />
              <stop offset="100%" stopColor="rgba(40, 120, 210, 0.08)" />
            </linearGradient>
          </defs>
          {edges.map(([fromIndex, toIndex], index) => {
            const from = allNodes[fromIndex]
            const to = allNodes[toIndex]
            return (
              <line
                key={`edge-${index}`}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                className="links-network__edge"
              />
            )
          })}
          {allNodes.map((node) => (
            <circle
              key={node.id}
              cx={node.cx}
              cy={node.cy}
              r={controls.nodeRadius}
              className={`links-network__node${
                activeNodes.has(node.id) ? ' is-active' : ''
              }`}
            />
          ))}
          {segments.map((segment) => {
            const style = {
              animationDelay: `${segment.delay}ms`,
              '--spark-length': `${segment.length}`,
            } as CSSProperties
            return (
              <line
                key={segment.id}
                x1={segment.startX}
                y1={segment.startY}
                x2={segment.endX}
                y2={segment.endY}
              className={`links-sparkline${
                segment.isStrong ? ' links-sparkline--strong' : ''
              }${segment.isFading ? ' is-fading' : ''}`}
              stroke={
                segment.isStrong
                  ? 'url(#links-spark-strong)'
                  : 'url(#links-spark-soft)'
              }
                style={style}
              />
            )
          })}
        </svg>
      </div>

      <div className="links-count" aria-hidden>
        {formatNumber(count)}
      </div>

      <div className="links-meta" aria-hidden>
        <p>あなた → 彼女 {formatNumber(linkExchangeCounts.fromYou)} 件</p>
        <p>彼女 → あなた {formatNumber(linkExchangeCounts.fromPartner)} 件</p>
      </div>

      {phase !== 'play' && (
        <div
          className={`links-caption${showLines ? ' is-visible' : ''}`}
          role="status"
        >
          <p>一年で交差したリンクの光跡。</p>
          <p>全部でこの数だけネットワークに載りました。</p>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <div className="links-cta">
          <button type="button" onClick={onAdvance}>
            タップで次へ
          </button>
        </div>
      )}

      <div
        className={`links-control-panel${panelOpen ? ' is-open' : ''}`}
        aria-hidden={false}
      >
        <button
          type="button"
          className="links-control-panel__toggle"
          onClick={() => setPanelOpen((prev) => !prev)}
        >
          {panelOpen ? 'close' : 'tune'}
        </button>
        <div className="links-control-panel__body">
          <label className="links-control">
            <span>Light intensity</span>
            <input
              type="range"
              min={0.4}
              max={1.6}
              step={0.02}
              value={controls.intensity}
              onChange={handleControlChange('intensity')}
            />
            <span className="links-control__value">
              {controls.intensity.toFixed(2)}
            </span>
          </label>
          <label className="links-control">
            <span>Spark speed (ms)</span>
            <input
              type="range"
              min={600}
              max={2200}
              step={20}
              value={controls.softDuration}
              onChange={handleControlChange('softDuration')}
            />
            <span className="links-control__value">
              {controls.softDuration}
            </span>
          </label>
          <label className="links-control">
            <span>Strong spark speed (ms)</span>
            <input
              type="range"
              min={600}
              max={2600}
              step={20}
              value={controls.strongDuration}
              onChange={handleControlChange('strongDuration')}
            />
            <span className="links-control__value">
              {controls.strongDuration}
            </span>
          </label>
          <label className="links-control">
            <span>Node size</span>
            <input
              type="range"
              min={0.5}
              max={1.3}
              step={0.02}
              value={controls.nodeRadius}
              onChange={handleControlChange('nodeRadius')}
            />
            <span className="links-control__value">
              {controls.nodeRadius.toFixed(2)}
            </span>
          </label>
          <label className="links-control">
            <span>Spark thickness</span>
            <input
              type="range"
              min={0.3}
              max={1.2}
              step={0.02}
              value={controls.thickness}
              onChange={handleControlChange('thickness')}
            />
            <span className="links-control__value">
              {controls.thickness.toFixed(2)}
            </span>
          </label>
        </div>
      </div>
    </section>
  )
}

const createSegment = (
  batch: number,
  order: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
  isStrong: boolean
): Segment => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  return {
    id: batch * 100 + order,
    batch,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    delay: order * 140,
    isStrong,
    length: Math.hypot(dx, dy),
    isFading: false,
  }
}
