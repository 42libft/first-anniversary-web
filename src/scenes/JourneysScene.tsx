import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { SceneLayout } from '../components/SceneLayout'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { Journey } from '../types/journey'
import type { SceneComponentProps } from '../types/scenes'

import './JourneysScene.css'

const PLANE_ANIMATION_MS = 1600

const distanceFormatter = new Intl.NumberFormat('ja-JP', {
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const timestampFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const formatDistance = (value: number) =>
  distanceFormatter.format(Math.round(value))

const getJourneyKey = (journey: Journey) =>
  `${journey.date}-${journey.from}-${journey.to}`

const formatJourneyDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return dateFormatter.format(date)
}

const formatRecordedAt = (value?: string) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return timestampFormatter.format(date)
}

const transportMeta = {
  plane: { label: 'AIR ROUTE', icon: '✈️' },
  train: { label: 'TRAIN ROUTE', icon: '🚅' },
  bus: { label: 'BUS ROUTE', icon: '🚌' },
} as const

const artBackgrounds: Record<string, string> = {
  'night-sky-market':
    'linear-gradient(145deg, rgba(30, 39, 89, 0.9), rgba(12, 17, 48, 0.95)), radial-gradient(circle at 20% 20%, rgba(255, 180, 255, 0.45), transparent 45%), radial-gradient(circle at 80% 70%, rgba(110, 190, 255, 0.35), transparent 55%)',
  'valentine-neon':
    'linear-gradient(160deg, rgba(55, 22, 76, 0.88), rgba(18, 16, 56, 0.95)), radial-gradient(circle at 78% 20%, rgba(255, 102, 196, 0.4), transparent 50%), radial-gradient(circle at 15% 70%, rgba(88, 147, 255, 0.4), transparent 55%)',
  'stardust-finale':
    'linear-gradient(150deg, rgba(18, 32, 78, 0.92), rgba(9, 12, 38, 0.95)), radial-gradient(circle at 30% 30%, rgba(255, 217, 140, 0.4), transparent 55%), radial-gradient(circle at 70% 75%, rgba(120, 225, 255, 0.35), transparent 50%)',
}

const getArtBackground = (artKey: string) =>
  artBackgrounds[artKey] ??
  'linear-gradient(150deg, rgba(20, 24, 60, 0.9), rgba(8, 10, 32, 0.95)), radial-gradient(circle at 30% 30%, rgba(255, 145, 245, 0.35), transparent 55%)'

export const JourneysScene = ({
  onAdvance,
  journeys,
  distanceTraveled,
  totalJourneyDistance,
  responses,
  saveResponse,
  setDistanceTraveled,
}: SceneComponentProps) => {
  const prefersReducedMotion = usePrefersReducedMotion()

  const cumulativeDistances = useMemo(() => {
    const totals = [0]
    journeys.forEach((journey) => {
      totals.push(totals[totals.length - 1] + journey.distanceKm)
    })
    return totals
  }, [journeys])

  const computeCompletedCount = useCallback(
    (distance: number) => {
      let count = 0
      for (let i = 0; i < journeys.length; i += 1) {
        const threshold = cumulativeDistances[i + 1] ?? Number.POSITIVE_INFINITY
        if (distance >= threshold) {
          count = i + 1
        } else {
          break
        }
      }
      return count
    },
    [journeys.length, cumulativeDistances]
  )

  const initialCompleted = computeCompletedCount(distanceTraveled)
  const initialActiveIndex =
    journeys.length === 0
      ? 0
      : Math.min(initialCompleted, journeys.length - 1)

  const [completedCount, setCompletedCount] = useState(initialCompleted)
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex)
  const [phase, setPhase] = useState<'idle' | 'animating' | 'arrived'>(
    () => (initialCompleted > initialActiveIndex ? 'arrived' : 'idle')
  )
  const [animationToken, setAnimationToken] = useState(0)

  const animationTimeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const derivedCompleted = computeCompletedCount(distanceTraveled)
    setCompletedCount((prev) =>
      prev === derivedCompleted ? prev : derivedCompleted
    )
  }, [distanceTraveled, computeCompletedCount])

  useEffect(() => {
    if (journeys.length === 0) {
      setActiveIndex(0)
      return
    }

    setActiveIndex((index) => Math.min(index, journeys.length - 1))
  }, [journeys.length])

  useEffect(() => {
    if (phase === 'animating') {
      return
    }

    const hasArrived = activeIndex < completedCount
    const nextPhase = hasArrived ? 'arrived' : 'idle'
    if (nextPhase !== phase) {
      setPhase(nextPhase)
    }
  }, [activeIndex, completedCount, phase])

  const completedDistance =
    cumulativeDistances[Math.min(completedCount, cumulativeDistances.length - 1)] ?? 0

  useEffect(() => {
    setDistanceTraveled(completedDistance)
  }, [completedDistance, setDistanceTraveled])

  const currentJourney = journeys[activeIndex]
  const currentJourneyKey = currentJourney ? getJourneyKey(currentJourney) : ''
  const isCurrentCompleted = activeIndex < completedCount

  const currentDistance = currentJourney?.distanceKm ?? 0
  const distanceBeforeCurrent =
    cumulativeDistances[Math.min(activeIndex, cumulativeDistances.length - 1)] ?? 0
  const distanceAfterCurrent =
    cumulativeDistances[Math.min(activeIndex + 1, cumulativeDistances.length - 1)] ??
    distanceBeforeCurrent + currentDistance

  const progressPercent = totalJourneyDistance
    ? Math.min(100, Math.max(0, (completedDistance / totalJourneyDistance) * 100))
    : 0

  const activeJourneyResponses = useMemo(
    () =>
      responses.filter((entry) => entry.journeyKey === currentJourneyKey),
    [responses, currentJourneyKey]
  )

  const responseByPrompt = useMemo(() => {
    const map = new Map<string, string>()
    activeJourneyResponses.forEach((entry) => {
      map.set(entry.prompt, entry.answer)
    })
    return map
  }, [activeJourneyResponses])

  const recordedAtByPrompt = useMemo(() => {
    const map = new Map<string, string>()
    activeJourneyResponses.forEach((entry) => {
      map.set(entry.prompt, entry.recordedAt)
    })
    return map
  }, [activeJourneyResponses])

  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!currentJourney) {
      setDraftAnswers({})
      return
    }

    const next: Record<string, string> = {}
    currentJourney.prompts.forEach((prompt) => {
      next[prompt.q] = responseByPrompt.get(prompt.q) ?? ''
    })

    setDraftAnswers(next)
  }, [currentJourney, responseByPrompt])

  const handleLaunch = () => {
    if (!currentJourney || phase === 'animating') {
      return
    }

    const duration = prefersReducedMotion ? 0 : PLANE_ANIMATION_MS
    const isReplay = isCurrentCompleted

    setAnimationToken((token) => token + 1)

    if (duration === 0) {
      if (!isReplay) {
        setCompletedCount((count) => Math.max(count, activeIndex + 1))
      }
      setPhase('arrived')
      return
    }

    setPhase('animating')
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current)
    }

    animationTimeoutRef.current = window.setTimeout(() => {
      animationTimeoutRef.current = null
      if (!isReplay) {
        setCompletedCount((count) => Math.max(count, activeIndex + 1))
      }
      setPhase('arrived')
    }, duration)
  }

  const handlePrevJourney = () => {
    if (activeIndex === 0) {
      return
    }

    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }

    setActiveIndex((index) => Math.max(index - 1, 0))
  }

  const handleNextJourney = () => {
    if (!isCurrentCompleted) {
      return
    }

    if (activeIndex === journeys.length - 1) {
      onAdvance()
      return
    }

    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }

    setActiveIndex((index) => Math.min(index + 1, journeys.length - 1))
  }

  const handleAnswerChange = (prompt: string, value: string) => {
    if (!currentJourney || !isCurrentCompleted) {
      return
    }

    setDraftAnswers((prev) => ({ ...prev, [prompt]: value }))
    saveResponse({
      journeyKey: currentJourneyKey,
      prompt,
      answer: value,
    })
  }

  if (!currentJourney) {
    return (
      <SceneLayout
        eyebrow="Journeys"
        title="移動演出と思い出ギャラリー"
        description="東京⇄福岡の移動をSVGアニメで描写しつつ、写真とキャプション、質問入力を組み合わせるハブシーンです。"
      >
        <p className="scene-note">
          まだ旅のデータが登録されていません。JSONを整備したら、ここに移動演出と質問カードが並びます。
        </p>
      </SceneLayout>
    )
  }

  const transport = transportMeta[currentJourney.transport]
  const planeState: 'idle' | 'animating' | 'complete' =
    phase === 'animating'
      ? 'animating'
      : isCurrentCompleted
        ? 'complete'
        : 'idle'

  const progressState: 'idle' | 'animating' | 'complete' = planeState

  const remainingDistance = Math.max(totalJourneyDistance - completedDistance, 0)

  const statusLabel = (() => {
    if (phase === 'animating') {
      return '移動中…'
    }
    if (isCurrentCompleted) {
      return '到着済み — 記録を残そう'
    }
    return `${currentJourney.from} → ${currentJourney.to} を開始 (タップ)`
  })()

  const planeClassName = [
    'journey-map__plane',
    prefersReducedMotion && planeState === 'complete'
      ? 'journey-map__plane--static'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <SceneLayout
      eyebrow="Journeys"
      title="移動演出と思い出ギャラリー"
      description="東京⇄福岡の移動をタップで辿り、到着ごとに写真と質問へ答えを残していきます。"
    >
      <div className="journeys-experience">
        <header className="journeys-header">
          <div className="journeys-header__row">
            <span className="journeys-header__label">
              JOURNEY {activeIndex + 1}/{journeys.length}
            </span>
            <span className="journeys-header__distance">
              累計 {formatDistance(completedDistance)} km
            </span>
          </div>
          <div className="journeys-progress-bar" aria-hidden="true">
            <div
              className="journeys-progress-bar__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="journeys-header__secondary">
            <span>
              残り {formatDistance(remainingDistance)} km
            </span>
            <span>
              {isCurrentCompleted
                ? `到着済み: ${formatDistance(distanceAfterCurrent)} km`
                : `出発前: ${formatDistance(distanceBeforeCurrent)} km`}
            </span>
          </div>
        </header>

        <button
          type="button"
          className="journey-map"
          onClick={handleLaunch}
          disabled={phase === 'animating'}
          aria-live="polite"
          aria-label={`${currentJourney.from}から${currentJourney.to}への移動を開始`}
        >
          <span className="journey-map__glow" aria-hidden="true" />
          <div className="journey-map__line" aria-hidden="true">
            <span className="journey-map__line-track" />
            <span
              key={`progress-${activeIndex}-${animationToken}-${progressState}`}
              className="journey-map__line-progress"
              data-state={progressState}
            />
          </div>
          <span
            key={`plane-${activeIndex}-${animationToken}-${planeState}`}
            className={planeClassName}
            data-state={planeState}
            aria-hidden="true"
          >
            <svg viewBox="0 0 60 32" role="img" aria-hidden="true">
              <path
                d="M2 14h24l8-10h7l-7 10h18l4 2-4 2H34l7 10h-7l-8-10H2l-2-2z"
                fill="url(#planeGradient)"
              />
              <defs>
                <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff66c4" />
                  <stop offset="100%" stopColor="#4d7bff" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <div className="journey-map__labels" aria-hidden="true">
            <span>{currentJourney.from}</span>
            <span>{currentJourney.to}</span>
          </div>
          <span className="journey-map__status">{statusLabel}</span>
        </button>

        <div className="journey-card">
          <div
            className="journey-card__media"
            style={{ background: getArtBackground(currentJourney.artKey) }}
          >
            <img
              className="journey-card__photo"
              src={currentJourney.photoURL}
              alt={`${currentJourney.from}から${currentJourney.to}の思い出写真`}
              loading="lazy"
            />
            <span className="journey-card__badge">
              <span className="journey-card__badge-icon" aria-hidden="true">
                {transport.icon}
              </span>
              {transport.label}
            </span>
          </div>
          <div className="journey-card__body">
            <div className="journey-card__meta">
              <span
                className={`journey-status journey-status--${
                  isCurrentCompleted ? 'arrived' : 'pending'
                }`}
              >
                {isCurrentCompleted ? 'ARRIVED' : 'READY'}
              </span>
              <span className="journey-card__date">
                {formatJourneyDate(currentJourney.date)}
              </span>
            </div>
            <div className="journey-card__route">
              <span className="journey-card__city">{currentJourney.from}</span>
              <span className="journey-card__arrow" aria-hidden="true">
                →
              </span>
              <span className="journey-card__city">{currentJourney.to}</span>
            </div>
            <div className="journey-card__transport">
              <span>{transport.icon}</span>
              <span>{transport.label}</span>
              <span>{formatDistance(currentJourney.distanceKm)} km</span>
            </div>
            <p className="journey-card__caption">{currentJourney.caption}</p>
            <div className="journey-card__stats">
              <div>
                <p className="journey-card__stat-label">今回の移動距離</p>
                <p className="journey-card__stat-value">
                  {formatDistance(currentJourney.distanceKm)} km
                </p>
              </div>
              <div>
                <p className="journey-card__stat-label">累計距離</p>
                <p className="journey-card__stat-value">
                  {formatDistance(
                    isCurrentCompleted ? distanceAfterCurrent : distanceBeforeCurrent
                  )}{' '}
                  km
                </p>
              </div>
            </div>
            <div className="journey-prompts">
              {!isCurrentCompleted ? (
                <p className="journey-prompts__locked">
                  フライトを完了すると質問が開きます。
                </p>
              ) : null}
              {currentJourney.prompts.map((prompt) => {
                const answer = draftAnswers[prompt.q] ?? ''
                const recordedAt = recordedAtByPrompt.get(prompt.q)

                return (
                  <label className="journey-prompt" key={prompt.q}>
                    <span className="journey-prompt__question">{prompt.q}</span>
                    <textarea
                      className="journey-prompt__input"
                      value={answer}
                      placeholder="ここに感じたことをメモ"
                      onChange={(event) =>
                        handleAnswerChange(prompt.q, event.currentTarget.value)
                      }
                      disabled={!isCurrentCompleted}
                      rows={3}
                    />
                    <span className="journey-prompt__status">
                      {recordedAt
                        ? `記録: ${formatRecordedAt(recordedAt)}`
                        : '未記録'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <nav className="journeys-nav" aria-label="Journeys navigation">
          <button
            type="button"
            className="journeys-nav__button"
            onClick={handlePrevJourney}
            disabled={activeIndex === 0}
          >
            前の旅へ
          </button>
          <button
            type="button"
            className="journeys-nav__button journeys-nav__button--primary"
            onClick={handleNextJourney}
            disabled={!isCurrentCompleted}
          >
            {activeIndex === journeys.length - 1 ? 'Messagesへ進む' : '次の移動へ'}
          </button>
        </nav>
      </div>
    </SceneLayout>
  )
}
