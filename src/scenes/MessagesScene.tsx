import { useEffect, useMemo, useRef, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import {
  busiestMessageMilestone,
  messageMilestones,
  totalMessages,
} from '../data/messages'
import { QuizCard } from '../components/QuizCard'
import { CanvasBubbles } from '../components/CanvasBubbles'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const MessagesScene = ({ onAdvance, totalJourneyDistance }: SceneComponentProps) => {
  // Bubble-driven counter and log
  const targetTotal = totalMessages
  const [count, setCount] = useState(0)
  const [counterPop, setCounterPop] = useState(false)
  const [, setSelectedMonth] = useState<string | null>(null)

  const bubbleFieldRef = useRef<HTMLDivElement | null>(null)

  type BubbleLogEntry = {
    id: string
    speaker: 'me' | 'you'
    text: string
    timestamp: string
    label?: string
  }
  const [bubbleLog, setBubbleLog] = useState<BubbleLogEntry[]>([])

  // Build a simple pool from existing previews
  const messagePool = useMemo((): Array<{ speaker: 'me' | 'you'; text: string }> => {
    const pool: Array<{ speaker: 'me' | 'you'; text: string }> = []
    messageMilestones.forEach((m) => {
      m.preview.forEach((p) => pool.push({ speaker: p.speaker, text: p.text }))
      // also split highlight as extra flavor
      m.highlight.split('。').forEach((s) => {
        const t = s.trim()
        if (t) pool.push({ speaker: 'me', text: t })
      })
    })
    // try to hydrate from external corpus (optional)
    try {
      // kick async fetch without blocking first render
      fetch('/data/messages-corpus.json')
        .then((r) => (r.ok ? r.json() : []))
        .then(() => {})
        .catch(() => void 0)
    } catch {}
    return pool.length ? pool : [{ speaker: 'me', text: 'だいすき' }]
  }, [])

  const nextMessageFromPool = (): { speaker: 'me' | 'you'; text: string } => {
    const i = Math.floor(Math.random() * messagePool.length)
    return messagePool[i]
  }

  // Counter pop animation toggle
  useEffect(() => {
    setCounterPop(true)
    const timer = setTimeout(() => setCounterPop(false), 420)
    return () => clearTimeout(timer)
  }, [count])

  // Auto-advance when filled
  useEffect(() => {
    if (count >= targetTotal) {
      const t = setTimeout(() => onAdvance(), 900)
      return () => clearTimeout(t)
    }
  }, [count, targetTotal, onAdvance])

  // Canvas側のバブルがポップしたら呼ばれる
  const handlePop = () => {
    setCount((c) => (c < targetTotal ? c + 1 : c))
    const msg = nextMessageFromPool()
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
    const entry: BubbleLogEntry = {
      id,
      speaker: msg.speaker,
      text: msg.text,
      timestamp: new Date().toTimeString().slice(0, 5),
    }
    setBubbleLog((log) => [...log, entry])
  }

  const quizOptions = useMemo(() => {
    const candidateMonths = [
      busiestMessageMilestone.month,
      '2024-02',
      '2024-07',
      '2024-04',
    ]

    const options: typeof messageMilestones = []

    for (const month of candidateMonths) {
      const found = messageMilestones.find((milestone) => milestone.month === month)
      if (!found) {
        continue
      }

      if (options.some((option) => option.month === found.month)) {
        continue
      }

      options.push(found)
      if (options.length === 3) {
        break
      }
    }

    return options
  }, [])

  // correctness is handled by QuizCard now
  const safeVisibleSteps = useMemo(() => {
    if (targetTotal <= 0) return messageMilestones.length
    const ratio = Math.min(1, count / targetTotal)
    const steps = Math.max(1, Math.round(ratio * messageMilestones.length))
    return steps
  }, [count, targetTotal])

  return (
    <SceneLayout
      eyebrow="Messages"
      title="メッセージの積み上げ"
      description="チャットバブルが増えていき、合計メッセージ数を可視化。距離データと連動したクイズで一年の温度感を振り返ります。"
      onAdvance={onAdvance}
      advanceLabel="Likesへ"
    >
      <div className="messages-module">
        <section className={`messages-counter${counterPop ? ' is-pop' : ''}`}>
          <p className="messages-counter__label">累計メッセージ</p>
          <p className="messages-counter__value">{formatNumber(count)}</p>
          <p className="messages-counter__note">
            全{formatNumber(targetTotal)}通のうち、タップでバブルを弾けさせてカウントアップ。
          </p>
          <p className="messages-counter__sub">最も賑やかだったのは {busiestMessageMilestone.label}</p>
        </section>

        <section className="chat-preview">
          <div ref={bubbleFieldRef} className="pop-field" role="button" aria-label="画面タップでバブルを弾けさせる" tabIndex={0}>
            <CanvasBubbles onPop={handlePop} />
            <div className="pop-field__hint">画面のどこでもタップ</div>
          </div>
          <div className="chat-preview__log">
            {bubbleLog.map((bubble) => (
              <div
                key={bubble.id}
                className={`chat-bubble chat-bubble--${bubble.speaker}`}
              >
                <p className="chat-bubble__text">{bubble.text}</p>
                <span className="chat-bubble__meta">{bubble.timestamp}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="messages-timeline">
          {messageMilestones.map((milestone, index) => (
            <article
              key={milestone.month}
              className={`messages-timeline__item${
                index < safeVisibleSteps ? ' is-active' : ''
              }`}
            >
              <p className="messages-timeline__label">{milestone.label}</p>
              <p className="messages-timeline__value">
                {formatNumber(milestone.monthlyTotal)}通
              </p>
              <p className="messages-timeline__distance">
                累計距離 {formatNumber(milestone.cumulativeDistanceKm)} km
              </p>
              <p className="messages-timeline__highlight">{milestone.highlight}</p>
            </article>
          ))}
        </section>

        <QuizCard
          id="messages-busiest-month"
          question={`合計${formatNumber(Math.round(totalJourneyDistance))}kmを旅した一年。いちばんメッセージが多かった月は？`}
          options={quizOptions.map((o) => ({
            value: o.month,
            label: o.label,
            meta: `${formatNumber(o.monthlyTotal)}通 / 距離 ${formatNumber(o.cumulativeDistanceKm)}km`,
          }))}
          correct={busiestMessageMilestone.month}
          hint={`ヒント：距離が${formatNumber(busiestMessageMilestone.cumulativeDistanceKm)}kmに到達した頃の盛り上がり。`}
          onAnswered={(value) => setSelectedMonth(value)}
        />
      </div>
    </SceneLayout>
  )
}
