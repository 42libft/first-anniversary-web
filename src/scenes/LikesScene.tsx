import { useEffect, useMemo, useRef, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import { confessionAnswer, likesMilestones, totalLikes } from '../data/likes'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

const heartColors = ['#ff66c4', '#ffd1f6', '#7ca9ff', '#ff9bd1']

type FloatingHeart = {
  id: number
  left: number
  scale: number
  duration: number
  delay: number
  color: string
  spin: number
}

const quizChoices = [
  { value: 'me', label: 'わたし', caption: '東京のホームから勇気を送信' },
  { value: 'you', label: 'あなた', caption: '福岡のバス停で「好き」宣言' },
  { value: 'together', label: '同時に言った', caption: '流星群の下でハモった説' },
] as const

export const LikesScene = ({ onAdvance }: SceneComponentProps) => {
  const [visibleSteps, setVisibleSteps] = useState(() =>
    Math.min(2, likesMilestones.length)
  )
  const [counterPop, setCounterPop] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const heartIdRef = useRef(0)
  const heartTimeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  const prefersReducedMotion = usePrefersReducedMotion()

  const safeVisibleSteps = Math.max(
    1,
    Math.min(visibleSteps, likesMilestones.length)
  )

  const visibleMilestones = likesMilestones.slice(0, safeVisibleSteps)

  const currentLikes =
    visibleMilestones[visibleMilestones.length - 1]?.cumulativeLikes ?? 0

  useEffect(() => {
    if (!visibleMilestones.length) {
      return
    }

    setCounterPop(true)
    const timer = setTimeout(() => setCounterPop(false), 520)
    return () => clearTimeout(timer)
  }, [currentLikes, visibleMilestones.length])

  useEffect(() => {
    return () => {
      heartTimeouts.current.forEach((timer) => clearTimeout(timer))
      heartTimeouts.current = []
    }
  }, [])

  const scheduleHeartRemoval = (id: number, lifetimeMs: number) => {
    const timer = setTimeout(() => {
      setHearts((prev) => prev.filter((heart) => heart.id !== id))
      heartTimeouts.current = heartTimeouts.current.filter((entry) => entry !== timer)
    }, lifetimeMs)

    heartTimeouts.current.push(timer)
  }

  const createHeart = (delayOffset: number) => {
    heartIdRef.current += 1
    const id = heartIdRef.current

    const delay = delayOffset + Math.random() * 0.25
    const duration = 2.6 + Math.random() * 1.2

    const heart: FloatingHeart = {
      id,
      left: Math.random() * 80 + 10,
      scale: 0.7 + Math.random() * 0.6,
      duration,
      delay,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
      spin: (Math.random() - 0.5) * 24,
    }

    setHearts((prev) => [...prev, heart])

    const lifetime = (delay + duration + 0.4) * 1000
    scheduleHeartRemoval(id, lifetime)
  }

  const handleReleaseHearts = () => {
    if (!prefersReducedMotion) {
      Array.from({ length: 4 }).forEach((_, index) => {
        createHeart(index * 0.18)
      })
    }

    if (safeVisibleSteps < likesMilestones.length) {
      setVisibleSteps((step) => Math.min(step + 1, likesMilestones.length))
    } else {
      setCounterPop(true)
      setTimeout(() => setCounterPop(false), 420)
    }
  }

  const handleSelectAnswer = (value: string) => {
    setSelectedAnswer(value)
  }

  const isCorrect = selectedAnswer === confessionAnswer.correct

  const timelineEntries = useMemo(
    () =>
      likesMilestones.map((milestone, index) => ({
        ...milestone,
        isActive: index < safeVisibleSteps,
      })),
    [safeVisibleSteps]
  )

  return (
    <SceneLayout
      eyebrow="Likes"
      title="好きのカウントアップ"
      description="ハートのパーティクルでふたりの『好き』の軌跡を可視化。インタラクションで節目を解放し、クイズで記憶を固定します。"
      onAdvance={onAdvance}
      advanceLabel="Meetupsへ"
    >
      <div className="likes-module">
        <section className={`likes-counter${counterPop ? ' is-pop' : ''}`}>
          <p className="likes-counter__label">累計「好き」</p>
          <p className="likes-counter__value">{formatNumber(currentLikes)}</p>
          <p className="likes-counter__note">
            全{formatNumber(totalLikes)}回のうち、
            {safeVisibleSteps}/{likesMilestones.length} の節目を再生中。
          </p>
        </section>

        <section className="heart-playground">
          <div className="heart-playground__canvas" aria-hidden="true">
            {hearts.map((heart) => (
              <span
                key={heart.id}
                className="floating-heart"
                style={{
                  left: `${heart.left}%`,
                  animationDuration: `${heart.duration}s`,
                  animationDelay: `${heart.delay}s`,
                  background: heart.color,
                  transform: `translateX(-50%) rotate(-45deg) scale(${heart.scale}) rotate(${heart.spin}deg)`,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="heart-playground__trigger"
            onClick={handleReleaseHearts}
          >
            ハートを放つ
          </button>
          <p className="heart-playground__hint">
            タップするたびに記録の節目がひとつずつ解放されます。
          </p>
        </section>

        <section className="likes-timeline">
          {timelineEntries.map((milestone) => (
            <article
              key={milestone.key}
              className={`likes-timeline__item${
                milestone.isActive ? ' is-active' : ''
              }`}
            >
              <p className="likes-timeline__label">{milestone.label}</p>
              <p className="likes-timeline__value">
                +{formatNumber(milestone.likesDelta)} / 累計{' '}
                {formatNumber(milestone.cumulativeLikes)}
              </p>
              <p className="likes-timeline__description">{milestone.description}</p>
            </article>
          ))}
        </section>

        <section className="quiz-card likes-quiz">
          <p className="quiz-card__question">最初に「好き」って言ったのはどっち？</p>
          <div className="quiz-card__options">
            {quizChoices.map((choice) => (
              <button
                key={choice.value}
                type="button"
                onClick={() => handleSelectAnswer(choice.value)}
                className={`quiz-option${
                  selectedAnswer === choice.value ? ' is-selected' : ''
                }${
                  selectedAnswer && choice.value === confessionAnswer.correct
                    ? ' is-correct'
                    : ''
                }`}
              >
                <span className="quiz-option__label">{choice.label}</span>
                <span className="quiz-option__meta">{choice.caption}</span>
              </button>
            ))}
          </div>
          {selectedAnswer ? (
            <p
              className={`quiz-card__feedback${
                isCorrect ? ' is-success' : ' is-error'
              }`}
            >
              {isCorrect
                ? `正解！${confessionAnswer.explanation}`
                : `実は${confessionAnswer.explanation}`}
            </p>
          ) : (
            <p className="quiz-card__hint">ヒント：空フェス遠征の帰り道を思い出して。</p>
          )}
        </section>
      </div>
    </SceneLayout>
  )
}
