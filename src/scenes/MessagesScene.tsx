import { useEffect, useMemo, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import {
  busiestMessageMilestone,
  messageMilestones,
  totalMessages,
} from '../data/messages'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const MessagesScene = ({
  onAdvance,
  totalDistance,
}: SceneComponentProps) => {
  const [visibleSteps, setVisibleSteps] = useState(() =>
    Math.min(2, messageMilestones.length)
  )
  const [counterPop, setCounterPop] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

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

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month)
  }

  const isCorrectSelection =
    selectedMonth === busiestMessageMilestone.month

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

        <section className="quiz-card">
          <p className="quiz-card__question">
            合計{formatNumber(Math.round(totalDistance))}kmを旅した一年。
            いちばんメッセージが多かった月は？
          </p>
          <div className="quiz-card__options">
            {quizOptions.map((option) => (
              <button
                key={option.month}
                type="button"
                onClick={() => handleSelectMonth(option.month)}
                className={`quiz-option${
                  selectedMonth === option.month ? ' is-selected' : ''
                }${
                  selectedMonth &&
                  option.month === busiestMessageMilestone.month
                    ? ' is-correct'
                    : ''
                }`}
              >
                <span className="quiz-option__label">{option.label}</span>
                <span className="quiz-option__meta">
                  {formatNumber(option.monthlyTotal)}通 / 距離{' '}
                  {formatNumber(option.cumulativeDistanceKm)}km
                </span>
              </button>
            ))}
          </div>
          {selectedMonth ? (
            <p
              className={`quiz-card__feedback${
                isCorrectSelection ? ' is-success' : ' is-error'
              }`}
            >
              {isCorrectSelection
                ? `正解！距離${formatNumber(
                    busiestMessageMilestone.cumulativeDistanceKm
                  )}km到達の勢いそのままに、言葉の打ち上げ花火が続いた月です。`
                : `惜しい…正解は ${
                    busiestMessageMilestone.label
                  }。距離${formatNumber(
                    busiestMessageMilestone.cumulativeDistanceKm
                  )}kmの瞬間に、会えない夜を埋めるようにメッセージが弾けました。`}
            </p>
          ) : (
            <p className="quiz-card__hint">
              ヒント：距離が
              {formatNumber(busiestMessageMilestone.cumulativeDistanceKm)}kmに
              到達したころの盛り上がりを思い出してみて。
            </p>
          )}
        </section>
      </div>
    </SceneLayout>
  )
}
