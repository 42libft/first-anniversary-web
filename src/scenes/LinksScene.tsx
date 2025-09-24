import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { linkExchangeCounts, totalLinks } from '../data/links'
import type { SceneComponentProps } from '../types/scenes'

const FINAL_TARGET = totalLinks
const TAP_INCREMENT = Math.max(1, Math.ceil(FINAL_TARGET / 32))

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
  const stageRef = useRef<HTMLDivElement | null>(null)
  const networkRef = useRef<SVGSVGElement | null>(null)
  const batchRef = useRef(0)

  const allNodes = useMemo<Node[]>(
    () => [...STATIC_NODES, ...dynamicNodes],
    [dynamicNodes]
  )

  const edges = useMemo<Array<[number, number]>>(
    () => [...STATIC_EDGES, ...dynamicEdges],
    [dynamicEdges]
  )

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
    const tapPoint = { x: svgPoint.x, y: svgPoint.y }
    const newNodePoint = { x: newNode.cx, y: newNode.cy }

    newSegments.push(createSegment(batchId, 0, tapPoint, newNodePoint, true))

    nearestIndices.forEach((entry, idx) => {
      const target = allNodes[entry.index]
      if (!target) return
      const targetPoint = { x: target.cx, y: target.cy }
      newSegments.push(
        createSegment(batchId, idx + 1, newNodePoint, targetPoint, false)
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
    }, 1600)

    setSegments((prev) => [...prev, ...newSegments])
    window.setTimeout(() => {
      setSegments((prev) => prev.filter((segment) => segment.batch !== batchId))
    }, 6000)

    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))
    event.preventDefault()
  }

  return (
    <section
      className="links-full"
      role="presentation"
      aria-label="共有したリンクの記録をネットワークの光で振り返る"
    >
      <div
        ref={stageRef}
        className="links-stage"
        aria-hidden
        onPointerDown={handleTap}
      >
        <svg ref={networkRef} className="links-network" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="links-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(96, 226, 255, 0.65)" />
              <stop offset="100%" stopColor="rgba(28, 144, 210, 0.32)" />
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
              r={0.82}
              className={`links-network__node${
                activeNodes.has(node.id) ? ' is-active' : ''
              }`}
            />
          ))}
        </svg>
        {segments.map((segment) => {
          const dx = segment.endX - segment.startX
          const dy = segment.endY - segment.startY
          const length = Math.hypot(dx, dy)
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI
          const style: CSSProperties & Record<string, string | number> = {
            left: `${segment.startX}%`,
            top: `${segment.startY}%`,
            width: `${length}%`,
            animationDelay: `${segment.delay}ms`,
          }
          style['--spark-rotate'] = `${angle}deg`
          return (
            <span
              key={segment.id}
              className={`links-spark${
                segment.isStrong ? ' links-spark--strong' : ''
              }`}
              style={style}
            />
          )
        })}
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
  return {
    id: batch * 100 + order,
    batch,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    delay: order * 120,
    isStrong,
  }
}
