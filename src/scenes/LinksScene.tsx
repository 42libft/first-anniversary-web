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

const NETWORK_NODES = [
  { id: 'n1', cx: 12, cy: 26, r: 1.6 },
  { id: 'n2', cx: 22, cy: 62, r: 1.15 },
  { id: 'n3', cx: 38, cy: 18, r: 1.4 },
  { id: 'n4', cx: 48, cy: 44, r: 1.1 },
  { id: 'n5', cx: 60, cy: 16, r: 1.4 },
  { id: 'n6', cx: 70, cy: 58, r: 1.6 },
  { id: 'n7', cx: 82, cy: 30, r: 1.2 },
  { id: 'n8', cx: 30, cy: 78, r: 1.35 },
  { id: 'n9', cx: 58, cy: 78, r: 1.1 },
  { id: 'n10', cx: 86, cy: 70, r: 1.25 },
] as const

const NETWORK_EDGES: Array<[number, number]> = [
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

type Segment = {
  id: number
  batch: number
  x: number
  y: number
  length: number
  angle: number
  delay: number
}

export const LinksScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(10, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [showLines, setShowLines] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set())
  const stageRef = useRef<HTMLDivElement | null>(null)
  const batchRef = useRef(0)

  const adjacency = useMemo(() => {
    const map = new Map<number, number[]>()
    NETWORK_NODES.forEach((_, index) => {
      map.set(index, [])
    })
    NETWORK_EDGES.forEach(([from, to]) => {
      map.get(from)?.push(to)
      map.get(to)?.push(from)
    })
    return map
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

  const findNearestNodeIndex = (x: number, y: number, rect: DOMRect) => {
    let nearestIndex = 0
    let minDistance = Number.POSITIVE_INFINITY
    NETWORK_NODES.forEach((node, index) => {
      const nodeX = (node.cx / 100) * rect.width
      const nodeY = (node.cy / 100) * rect.height
      const distance = Math.hypot(x - nodeX, y - nodeY)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = index
      }
    })
    return nearestIndex
  }

  const findPath = (startIndex: number, targetIndex: number) => {
    if (startIndex === targetIndex) return [startIndex]
    const visited = new Set<number>([startIndex])
    const queue: Array<{ index: number; path: number[] }> = [
      { index: startIndex, path: [startIndex] },
    ]
    while (queue.length) {
      const current = queue.shift()
      if (!current) break
      const neighbors = adjacency.get(current.index) ?? []
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue
        const nextPath = [...current.path, neighbor]
        if (neighbor === targetIndex) {
          return nextPath
        }
        visited.add(neighbor)
        queue.push({ index: neighbor, path: nextPath })
      }
    }
    return [startIndex, targetIndex]
  }

  const handleTap = (event: PointerEvent<HTMLDivElement>) => {
    if (phase !== 'play') return
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const startX = event.clientX - rect.left
    const startY = event.clientY - rect.top

    const startIndex = findNearestNodeIndex(startX, startY, rect)
    let targetIndex = startIndex
    while (targetIndex === startIndex && NETWORK_NODES.length > 1) {
      targetIndex = Math.floor(Math.random() * NETWORK_NODES.length)
    }
    const path = findPath(startIndex, targetIndex)
    batchRef.current += 1
    const batchId = batchRef.current

    const newSegments: Segment[] = []

    path.forEach((nodeIndex, idx) => {
      const node = NETWORK_NODES[nodeIndex]
      setActiveNodes((prev) => {
        const next = new Set(prev)
        next.add(node.id)
        return next
      })
      window.setTimeout(() => {
        setActiveNodes((prev) => {
          const next = new Set(prev)
          next.delete(node.id)
          return next
        })
      }, 900 + idx * 120)

      const startPoint = idx === 0 ? { x: startX, y: startY } : nodePoint(path[idx - 1], rect)
      const endPoint = nodePoint(nodeIndex, rect)
      newSegments.push(
        createSegment(batchId, idx, startPoint, endPoint)
      )
    })

    setSegments((prev) => [...prev, ...newSegments])
    window.setTimeout(() => {
      setSegments((prev) => prev.filter((segment) => segment.batch !== batchId))
    }, 1600)

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
        <svg className="links-network" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="links-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(96, 226, 255, 0.65)" />
              <stop offset="100%" stopColor="rgba(28, 144, 210, 0.32)" />
            </linearGradient>
          </defs>
          {NETWORK_EDGES.map(([fromIndex, toIndex], index) => {
            const from = NETWORK_NODES[fromIndex]
            const to = NETWORK_NODES[toIndex]
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
          {NETWORK_NODES.map((node) => (
            <circle
              key={node.id}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              className={`links-network__node${
                activeNodes.has(node.id) ? ' is-active' : ''
              }`}
            />
          ))}
        </svg>
        {segments.map((segment) => {
          const style: CSSProperties & { '--spark-rotate': string } = {
            left: `${segment.x}px`,
            top: `${segment.y}px`,
            width: `${segment.length}px`,
            animationDelay: `${segment.delay}ms`,
            '--spark-rotate': `${segment.angle}deg`,
          }
          return <span key={segment.id} className="links-spark" style={style} />
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

const nodePoint = (index: number, rect: DOMRect) => {
  const node = NETWORK_NODES[index]
  return {
    x: (node.cx / 100) * rect.width,
    y: (node.cy / 100) * rect.height,
  }
}

const createSegment = (
  batch: number,
  order: number,
  start: { x: number; y: number },
  end: { x: number; y: number }
): Segment => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return {
    id: batch * 100 + order,
    batch,
    x: start.x,
    y: start.y,
    length,
    angle,
    delay: order * 110,
  }
}
