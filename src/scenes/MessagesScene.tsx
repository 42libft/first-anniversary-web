import { useEffect, useMemo, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import {
  busiestMessageMilestone,
  messageMilestones,
  totalMessages,
} from '../data/messages'
import { QuizCard } from '../components/QuizCard'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const MessagesScene = ({
  onAdvance,
  totalJourneyDistance,
}: SceneComponentProps) => {
  const [visibleSteps, setVisibleSteps] = useState(() =>
    Math.min(2, messageMilestones.length)
  )
  const [counterPop, setCounterPop] = useState(false)
  const [, setSelectedMonth] = useState<string | null>(null)

  const safeVisibleSteps = Math.max(
    1,
    Math.min(visibleSteps, messageMilestones.length)
  )
  const visibleMilestones = messageMilestones.slice(0, safeVisibleSteps)

  const currentTotal =
    visibleMilestones[visibleMilestones.length - 1]?.cumulativeTotal ?? 0

  useEffect(() => {
    if (!visibleMilestones.length) {
      return
    }

    setCounterPop(true)
    const timer = setTimeout(() => setCounterPop(false), 520)
    return () => clearTimeout(timer)
  }, [currentTotal, visibleMilestones.length])

  const chatBubbles = useMemo(
    () =>
      visibleMilestones.flatMap((milestone) =>
        milestone.preview.map((bubble, index) => ({
          id: `${milestone.month}-${index}`,
          ...bubble,
          label: milestone.label,
        }))
      ),
    [visibleMilestones]
  )

  const canRevealMore = safeVisibleSteps < messageMilestones.length

  const handleRevealNext = () => {
    if (canRevealMore) {
      setVisibleSteps((step) => Math.min(step + 1, messageMilestones.length))
    } else {
      setCounterPop(true)
      setTimeout(() => setCounterPop(false), 400)
    }
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
          <p className="messages-counter__value">{formatNumber(currentTotal)}</p>
          <p className="messages-counter__note">
            全{formatNumber(totalMessages)}通のうち、
            {safeVisibleSteps}/{messageMilestones.length} ヶ月分を再生中。
          </p>
          <p className="messages-counter__sub">最も賑やかだったのは {busiestMessageMilestone.label}</p>
        </section>

        <section className="chat-preview">
          <div className="chat-preview__log">
            {chatBubbles.map((bubble) => (
              <div
                key={bubble.id}
                className={`chat-bubble chat-bubble--${bubble.speaker}`}
              >
                <p className="chat-bubble__text">{bubble.text}</p>
                <span className="chat-bubble__meta">
                  {bubble.timestamp} · {bubble.label}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="chat-preview__button"
            onClick={handleRevealNext}
          >
            {canRevealMore ? 'バブルを追加' : 'もう一度はじけさせる'}
          </button>
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
