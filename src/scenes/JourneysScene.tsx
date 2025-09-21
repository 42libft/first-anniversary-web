import { useCallback, useEffect, useMemo, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import type {
  Journey,
  JourneyCoordinate,
  JourneyEpisodeStep,
  JourneyMoveMode,
  JourneyMoveStep,
  JourneyQuestionStep,
  JourneyStep,
} from '../types/journey'
import type { SceneComponentProps } from '../types/scenes'

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

const transportMeta: Record<JourneyMoveMode, { label: string; icon: string }> = {
  flight: { label: 'FLIGHT', icon: '✈️' },
  walk: { label: 'WALK', icon: '🚶' },
  bus: { label: 'BUS', icon: '🚌' },
  train: { label: 'TRAIN', icon: '🚆' },
}

const artBackgrounds: Record<string, string> = {
  'night-sky-market':
    'linear-gradient(145deg, rgba(30, 39, 89, 0.92), rgba(12, 17, 48, 0.96)), radial-gradient(circle at 20% 20%, rgba(255, 196, 255, 0.45), transparent 48%), radial-gradient(circle at 78% 70%, rgba(110, 190, 255, 0.38), transparent 55%)',
  'valentine-neon':
    'linear-gradient(160deg, rgba(55, 22, 76, 0.9), rgba(18, 16, 56, 0.96)), radial-gradient(circle at 82% 18%, rgba(255, 102, 196, 0.45), transparent 50%), radial-gradient(circle at 14% 78%, rgba(88, 147, 255, 0.38), transparent 52%)',
  'stardust-finale':
    'linear-gradient(150deg, rgba(18, 32, 78, 0.92), rgba(9, 12, 38, 0.95)), radial-gradient(circle at 32% 28%, rgba(255, 217, 140, 0.45), transparent 55%), radial-gradient(circle at 72% 72%, rgba(120, 225, 255, 0.4), transparent 50%)',
}

const defaultArtBackground =
  'linear-gradient(150deg, rgba(20, 24, 60, 0.92), rgba(8, 10, 32, 0.95))'

const getArtBackground = (key?: string) =>
  (key ? artBackgrounds[key] : undefined) ?? defaultArtBackground

const getRoutePoints = (step: JourneyMoveStep): JourneyCoordinate[] => {
  if (step.route && step.route.length >= 2) {
    return step.route
  }

  if (step.fromCoord && step.toCoord) {
    return [step.fromCoord, step.toCoord]
  }

  return [
    [16, 78],
    [32, 66],
    [52, 52],
    [74, 38],
    [88, 26],
  ]
}

const toRoutePath = (points: JourneyCoordinate[]): string => {
  if (!points.length) {
    return ''
  }

  const [first, ...rest] = points
  return rest.reduce(
    (acc, point) => `${acc} L ${point[0]} ${point[1]}`,
    `M ${first[0]} ${first[1]}`
  )
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const createFlightRoutePath = (
  from: JourneyCoordinate,
  to: JourneyCoordinate
): string => {
  const [x1, y1] = from
  const [x2, y2] = to
  const midX = (x1 + x2) / 2
  const distance = Math.hypot(x2 - x1, y2 - y1)
  const arcHeight = clamp(Math.min(y1, y2) - distance * 0.2, 6, 88)

  return `M ${x1} ${y1} Q ${midX} ${arcHeight} ${x2} ${y2}`
}

type StepEntry = {
  journey: Journey
  step: JourneyStep
  journeyIndex: number
  stepIndex: number
  globalIndex: number
}

const buildStepEntries = (journeyList: Journey[]): StepEntry[] => {
  const entries: StepEntry[] = []

  journeyList.forEach((journey, journeyIndex) => {
    journey.steps.forEach((step, stepIndex) => {
      entries.push({
        journey,
        step,
        journeyIndex,
        stepIndex,
        globalIndex: entries.length,
      })
    })
  })

  return entries
}

const sumTraveledDistance = (entries: StepEntry[], activeIndex: number) =>
  entries.reduce((sum, entry, index) => {
    if (entry.step.type !== 'move') {
      return sum
    }

    if (index > activeIndex) {
      return sum
    }

    return sum + entry.step.distanceKm
  }, 0)

const JourneyFlightRoute = ({ step }: { step: JourneyMoveStep }) => {
  const from = step.fromCoord ?? [18, 74]
  const to = step.toCoord ?? [82, 24]
  const pathData = createFlightRoutePath(from, to)
  const gradientId = `journey-flight-gradient-${step.id}`

  return (
    <figure
      className="journey-map journey-map--flight"
      aria-label={`${step.from}から${step.to}へのフライトルート概略図`}
    >
      <div className="journey-map__surface">
        <svg viewBox="0 0 100 100" role="presentation" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff66c4" />
              <stop offset="100%" stopColor="#4d7bff" />
            </linearGradient>
          </defs>
          <path
            className="journey-map__orbit"
            d="M -10 82 Q 50 18 110 36"
            role="presentation"
          />
          <path className="journey-map__track" d={pathData} />
          <path className="journey-map__route" d={pathData} stroke={`url(#${gradientId})`} />
          <g>
            <circle className="journey-map__node" cx={from[0]} cy={from[1]} r={3.2} />
            <circle className="journey-map__node journey-map__node--end" cx={to[0]} cy={to[1]} r={3.4} />
          </g>
        </svg>
      </div>
      <figcaption className="journey-map__caption">上空ルート（概念図）</figcaption>
    </figure>
  )
}

const JourneyStaticMap = ({ step }: { step: JourneyMoveStep }) => {
  const illustration = step.mapIllustration
  const points = getRoutePoints(step)
  const pathData = toRoutePath(points)

  return (
    <figure className="journey-map journey-map--ground">
      <div className="journey-map__surface">
        {illustration ? (
          <img
            src={illustration.src}
            alt={illustration.alt}
            loading="lazy"
            className="journey-map__image"
          />
        ) : (
          <div className="journey-map__placeholder">
            ルートマップが登録されていません。
          </div>
        )}
        <svg
          className="journey-map__overlay"
          viewBox="0 0 100 100"
          role="presentation"
          focusable="false"
        >
          <path className="journey-map__track" d={pathData} />
          <path className="journey-map__route" d={pathData} />
          {points.map((point, index) => (
            <circle
              key={`${point[0]}-${point[1]}-${index}`}
              className={`journey-map__node${
                index === points.length - 1 ? ' journey-map__node--end' : ''
              }`}
              cx={point[0]}
              cy={point[1]}
              r={index === 0 || index === points.length - 1 ? 2.8 : 1.6}
            />
          ))}
        </svg>
      </div>
      {illustration?.caption ? (
        <figcaption className="journey-map__caption">{illustration.caption}</figcaption>
      ) : null}
    </figure>
  )
}

const JourneyMovePage = ({
  step,
  journey,
}: {
  step: JourneyMoveStep
  journey: Journey
}) => {
  const transport = transportMeta[step.mode]
  const isFlight = step.mode === 'flight'

  return (
    <article className={`journey-card journey-card--move journey-card--${step.mode}`}>
      <div className="journey-card__header">
        <span className="journey-status journey-status--arrived">MOVE</span>
        <span className="journey-card__date">{formatJourneyDate(journey.date)}</span>
      </div>
      <div className="journey-card__headline">
        <div className="journey-card__route">
          <span className="journey-card__city">{step.from}</span>
          <span className="journey-card__arrow" aria-hidden="true">
            →
          </span>
          <span className="journey-card__city">{step.to}</span>
        </div>
        <div className="journey-card__transport">
          <span aria-hidden="true">{transport?.icon ?? '•'}</span>
          <span>{transport?.label ?? step.mode.toUpperCase()}</span>
          <span>{formatDistance(step.distanceKm)} km</span>
        </div>
      </div>
      <div className="journey-card__map">
        {isFlight ? <JourneyFlightRoute step={step} /> : <JourneyStaticMap step={step} />}
      </div>
      {step.description ? (
        <p className="journey-card__caption">{step.description}</p>
      ) : null}
      {step.meta ? (
        <dl className="journey-card__meta-grid">
          {step.meta.flightNo ? (
            <div>
              <dt>便名</dt>
              <dd>{step.meta.flightNo}</dd>
            </div>
          ) : null}
          {step.meta.dep ? (
            <div>
              <dt>出発</dt>
              <dd>{step.meta.dep}</dd>
            </div>
          ) : null}
          {step.meta.arr ? (
            <div>
              <dt>到着</dt>
              <dd>{step.meta.arr}</dd>
            </div>
          ) : null}
          {step.meta.note ? (
            <div className="journey-card__meta-note">
              <dt>NOTE</dt>
              <dd>{step.meta.note}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </article>
  )
}

const JourneyEpisodePage = ({
  step,
  journey,
}: {
  step: JourneyEpisodeStep
  journey: Journey
}) => (
  <article className="journey-card journey-card--episode">
    <div
      className="journey-card__media"
      style={{ background: getArtBackground(step.artKey) }}
    >
      <img
        className="journey-card__photo"
        src={step.photo.src}
        alt={step.photo.alt}
        loading="lazy"
        style={
          step.photo.objectPosition
            ? { objectPosition: step.photo.objectPosition }
            : undefined
        }
      />
      <span className="journey-card__badge">
        <span className="journey-card__badge-icon" aria-hidden="true">
          ✨
        </span>
        MEMORIES
      </span>
    </div>
    <div className="journey-card__body">
      <div className="journey-card__header">
        <span className="journey-status journey-status--arrived">EPISODE</span>
        <span className="journey-card__date">{formatJourneyDate(journey.date)}</span>
      </div>
      {step.title ? (
        <h3 className="journey-card__episode-title">{step.title}</h3>
      ) : null}
      <div className="journey-card__text-group">
        {step.text.map((paragraph, index) => (
          <p key={index} className="journey-card__caption">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  </article>
)

const JourneyQuestionPage = ({
  step,
  journey,
  value,
  storedResponse,
  isActive,
  isLocked,
  onAnswerChange,
  onTextBlur,
}: {
  step: JourneyQuestionStep
  journey: Journey
  value: string
  storedResponse?: SceneComponentProps['responses'][number]
  isActive: boolean
  isLocked: boolean
  onAnswerChange?: (value: string) => void
  onTextBlur?: () => void
}) => {
  const isChoice = step.style === 'choice'
  const recordedLabel = storedResponse?.recordedAt
    ? `記録: ${formatRecordedAt(storedResponse.recordedAt)}`
    : '未記録'

  const lockMessage = !isActive
    ? storedResponse
      ? '保存済みの記録です。'
      : '移動ページで進めると回答できます。'
    : isLocked
      ? '保存済みのため編集できません。'
      : null

  return (
    <article className="journey-card journey-card--question">
      <div className="journey-card__body">
        <div className="journey-card__header">
          <span className="journey-status journey-status--arrived">
            {isChoice ? 'QUIZ' : 'NOTE'}
          </span>
          <span className="journey-card__date">{formatJourneyDate(journey.date)}</span>
        </div>
        <div className="journey-prompts journey-prompts--single">
          <div className="journey-prompt" role="group">
            <span className="journey-prompt__question">{step.prompt}</span>
            {step.helper ? (
              <span className="journey-prompt__helper">{step.helper}</span>
            ) : null}
            {isChoice ? (
              <div className="journey-prompt__choices">
                {(step.choices ?? []).map((choice) => {
                  const isSelected = value === choice
                  const disabled = isLocked || !isActive
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={`journey-choice${
                        isSelected ? ' is-selected' : ''
                      }${disabled ? ' is-locked' : ''}`}
                      onClick={
                        disabled || !onAnswerChange
                          ? undefined
                          : () => onAnswerChange(choice)
                      }
                      disabled={disabled}
                    >
                      <span className="journey-choice__icon" aria-hidden="true">
                        {isSelected ? '●' : '○'}
                      </span>
                      <span className="journey-choice__label">{choice}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <textarea
                id={step.id}
                className="journey-prompt__input"
                value={value}
                placeholder={step.placeholder ?? 'ここに感じたことをメモ'}
                onChange={
                  !isLocked && isActive && onAnswerChange
                    ? (event) => onAnswerChange(event.currentTarget.value)
                    : undefined
                }
                onBlur={isActive && onTextBlur ? onTextBlur : undefined}
                disabled={isLocked || !isActive}
                rows={4}
              />
            )}
            <div className="journey-prompt__footer">
              <span className="journey-prompt__status">{recordedLabel}</span>
              {lockMessage ? (
                <span className="journey-prompts__locked">{lockMessage}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export const JourneysScene = ({
  onAdvance,
  journeys,
  responses,
  saveResponse,
  setDistanceTraveled,
}: SceneComponentProps) => {
  const stepEntries = useMemo(() => buildStepEntries(journeys), [journeys])
  const stepCount = stepEntries.length
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (stepCount === 0) {
      setActiveIndex(0)
      return
    }

    if (activeIndex >= stepCount) {
      setActiveIndex(stepCount - 1)
    }
  }, [activeIndex, stepCount])

  const activeEntry = stepEntries[activeIndex]
  const activeJourney = activeEntry?.journey
  const activeStep = activeEntry?.step

  const traveledDistance = useMemo(
    () => sumTraveledDistance(stepEntries, activeIndex),
    [stepEntries, activeIndex]
  )

  useEffect(() => {
    setDistanceTraveled(traveledDistance)
  }, [setDistanceTraveled, traveledDistance])

  const responseMap = useMemo(() => {
    const map = new Map<string, typeof responses[number]>()
    responses.forEach((entry) => {
      map.set(entry.storageKey, entry)
    })
    return map
  }, [responses])

  const storedResponse = activeStep?.type === 'question'
    ? responseMap.get(activeStep.storageKey)
    : undefined

  const isQuestionReadOnly = activeStep?.type === 'question'
    ? Boolean(storedResponse) && activeStep.readonlyAfterSave !== false
    : false

  const [draftAnswer, setDraftAnswer] = useState('')

  useEffect(() => {
    if (activeStep?.type === 'question') {
      setDraftAnswer(storedResponse?.answer ?? '')
    } else {
      setDraftAnswer('')
    }
  }, [activeStep, storedResponse])

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!activeEntry || activeStep?.type !== 'question') {
        return
      }

      if (activeStep.readonlyAfterSave !== false && storedResponse) {
        return
      }

      setDraftAnswer(value)

      if (
        activeStep.style === 'choice' ||
        activeStep.readonlyAfterSave === false
      ) {
        if (storedResponse?.answer === value) {
          return
        }

        saveResponse({
          journeyId: activeEntry.journey.id,
          stepId: activeStep.id,
          storageKey: activeStep.storageKey,
          prompt: activeStep.prompt,
          answer: value,
        })
      }
    },
    [activeEntry, activeStep, saveResponse, storedResponse]
  )

  const handleTextBlur = useCallback(() => {
    if (!activeEntry || activeStep?.type !== 'question') {
      return
    }

    if (activeStep.style !== 'text') {
      return
    }

    if (activeStep.readonlyAfterSave !== false && storedResponse) {
      return
    }

    if (!draftAnswer.trim()) {
      return
    }

    saveResponse({
      journeyId: activeEntry.journey.id,
      stepId: activeStep.id,
      storageKey: activeStep.storageKey,
      prompt: activeStep.prompt,
      answer: draftAnswer,
    })
  }, [activeEntry, activeStep, draftAnswer, saveResponse, storedResponse])

  const handlePrev = useCallback(() => {
    if (stepCount === 0) {
      return
    }

    setActiveIndex((index) => Math.max(index - 1, 0))
  }, [stepCount])

  const handleNext = useCallback(() => {
    if (stepCount === 0) {
      onAdvance()
      return
    }

    if (activeIndex >= stepCount - 1) {
      onAdvance()
      return
    }

    setActiveIndex((index) => Math.min(index + 1, stepCount - 1))
  }, [activeIndex, onAdvance, stepCount])

  if (!activeJourney || !activeStep) {
    return (
      <SceneLayout
        eyebrow="Journeys"
        title="旅の移動演出ログ"
        description="旅データを整備すると、ここに移動・思い出・クイズページが並びます。"
      >
        <p className="scene-note">
          まだ旅のデータが登録されていません。`src/data/journeys.ts` にステップを追加すると紙芝居が完成します。
        </p>
      </SceneLayout>
    )
  }

  const { journeyIndex, stepIndex } = activeEntry
  const journeyCount = journeys.length
  const journeyStepTotal = activeJourney.steps.length
  const isFinalStep = activeIndex === stepCount - 1
  const isLastStepInJourney = stepIndex === journeyStepTotal - 1

  const nextButtonLabel = isFinalStep
    ? 'Messagesへ進む'
    : isLastStepInJourney
      ? '次の旅へ'
      : '次のページ'

  const headerSubtitle = (() => {
    if (activeStep.type === 'move') {
      return `${activeStep.from} → ${activeStep.to}`
    }

    if (activeStep.type === 'episode') {
      return activeStep.title ?? activeJourney.title
    }

    return activeStep.prompt
  })()

  const headerDescription = (() => {
    if (activeStep.type === 'move') {
      return activeStep.description ?? ''
    }

    if (activeStep.type === 'episode') {
      return activeStep.text[0] ?? ''
    }

    return activeStep.helper ?? ''
  })()

  const progressPercent = stepCount > 1 ? ((activeIndex + 1) / stepCount) * 100 : 100
  const isPageInteractive = activeStep.type === 'question' && !isQuestionReadOnly

  return (
    <SceneLayout
      eyebrow="Journeys"
      title="旅の移動演出ログ"
      description="移動ページと思い出ページをめくりながら、紙芝居のように一年の旅路を振り返ろう。"
    >
      <div className="journeys-experience">
        <header className="journeys-header">
          <div className="journeys-header__row">
            <span className="journeys-header__label">
              JOURNEY {journeyIndex + 1} / {journeyCount}
            </span>
            <span className="journeys-header__step">
              STEP {activeIndex + 1} / {stepCount}
            </span>
          </div>
          <h2 className="journeys-header__title">{activeJourney.title}</h2>
          <div className="journeys-header__meta">
            <span className="journeys-header__date">
              {formatJourneyDate(activeJourney.date)}
            </span>
            <span className="journeys-header__chip">
              {activeStep.type === 'move'
                ? '移動'
                : activeStep.type === 'episode'
                  ? '思い出'
                  : activeStep.style === 'choice'
                    ? 'クイズ'
                    : '記録'}
            </span>
            {activeStep.type === 'move' ? (
              <span className="journeys-header__chip">
                <span aria-hidden="true">{transportMeta[activeStep.mode].icon}</span>
                {transportMeta[activeStep.mode].label}
              </span>
            ) : null}
            <span className="journeys-header__chip">
              {formatDistance(traveledDistance)} km 到達
            </span>
          </div>
          {headerSubtitle ? (
            <p className="journeys-header__subtitle">{headerSubtitle}</p>
          ) : null}
          {headerDescription ? (
            <p className="journeys-header__description">{headerDescription}</p>
          ) : null}
          <div className="journeys-progress-bar" aria-hidden="true">
            <div
              className="journeys-progress-bar__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        <div className="journeys-stage">
          <div className="journeys-stage__page">
            {activeStep.type === 'move' ? (
              <JourneyMovePage step={activeStep} journey={activeJourney} />
            ) : activeStep.type === 'episode' ? (
              <JourneyEpisodePage step={activeStep} journey={activeJourney} />
            ) : (
              <JourneyQuestionPage
                step={activeStep}
                journey={activeJourney}
                value={isQuestionReadOnly ? storedResponse?.answer ?? '' : draftAnswer}
                storedResponse={storedResponse}
                isActive={!isQuestionReadOnly}
                isLocked={isQuestionReadOnly}
                onAnswerChange={!isQuestionReadOnly ? handleAnswerChange : undefined}
                onTextBlur={!isQuestionReadOnly ? handleTextBlur : undefined}
              />
            )}
          </div>
          {!isPageInteractive ? (
            <button
              type="button"
              className="journeys-stage__advance"
              onClick={handleNext}
            >
              <span>タップで次へ</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <p className="journeys-stage__hint" aria-live="polite">
              回答を入力すると保存できます。
            </p>
          )}
        </div>

        <nav className="journeys-nav" aria-label="Journeys navigation">
          <button
            type="button"
            className="journeys-nav__button"
            onClick={handlePrev}
            disabled={activeIndex === 0}
          >
            前のページ
          </button>
          <button
            type="button"
            className="journeys-nav__button journeys-nav__button--primary"
            onClick={handleNext}
          >
            {nextButtonLabel}
          </button>
        </nav>
      </div>
    </SceneLayout>
  )
}
