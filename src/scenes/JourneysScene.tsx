import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { SceneLayout } from '../components/SceneLayout'
import type {
  Journey,
  JourneyEpisodeStep,
  JourneyMoveMode,
  JourneyMoveStep,
  JourneyQuestionStep,
  JourneyStep,
  JourneyCoordinate,
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

const stepTypeLabel: Record<JourneyStep['type'], string> = {
  move: '移動',
  episode: '思い出',
  question: '記録',
}

const defaultRoute: JourneyCoordinate[] = [
  [12, 78],
  [28, 66],
  [50, 54],
  [72, 42],
  [88, 28],
]

const getRoutePoints = (step: JourneyMoveStep): JourneyCoordinate[] => {
  if (step.route && step.route.length >= 2) {
    return step.route
  }

  if (step.fromCoord && step.toCoord) {
    return [step.fromCoord, step.toCoord]
  }

  return defaultRoute
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

const isMoveStep = (step: JourneyStep | undefined): step is JourneyMoveStep =>
  step?.type === 'move'

const isEpisodeStep = (
  step: JourneyStep | undefined
): step is JourneyEpisodeStep => step?.type === 'episode'

const isQuestionStep = (
  step: JourneyStep | undefined
): step is JourneyQuestionStep => step?.type === 'question'

const findLatestEntry = (
  entries: StepEntry[],
  maxIndex: number,
  matcher: (step: JourneyStep) => boolean
): StepEntry | undefined => {
  for (let index = Math.min(maxIndex, entries.length - 1); index >= 0; index -= 1) {
    const entry = entries[index]
    if (entry && matcher(entry.step)) {
      return entry
    }
  }

  return undefined
}

const computeTraveledDistance = (
  journeyList: Journey[],
  activeJourneyIndex: number,
  activeStepIndex: number
) => {
  let sum = 0

  journeyList.forEach((journey, journeyIndex) => {
    journey.steps.forEach((step, stepIndex) => {
      if (step.type !== 'move') {
        return
      }

      const isBeforeActiveJourney = journeyIndex < activeJourneyIndex
      const isSameJourney = journeyIndex === activeJourneyIndex
      const isBeforeOrEqualStep = stepIndex <= activeStepIndex

      if (isBeforeActiveJourney || (isSameJourney && isBeforeOrEqualStep)) {
        sum += step.distanceKm
      }
    })
  })

  return sum
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
  const arcHeight = clamp(Math.min(y1, y2) - distance * 0.18, 5, 95)

  return `M ${x1} ${y1} Q ${midX} ${arcHeight} ${x2} ${y2}`
}

const JourneyRouteMap = ({ step }: { step: JourneyMoveStep }) => {
  const points =
    step.mode === 'flight' && step.fromCoord && step.toCoord
      ? [step.fromCoord, step.toCoord]
      : getRoutePoints(step)

  const pathData =
    step.mode === 'flight' && step.fromCoord && step.toCoord
      ? createFlightRoutePath(step.fromCoord, step.toCoord)
      : toRoutePath(points)

  const gradientId = `journey-route-gradient-${step.id}`

  return (
    <div className={`journey-route journey-route--${step.mode}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" role="presentation" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff66c4" />
            <stop offset="100%" stopColor="#4d7bff" />
          </linearGradient>
        </defs>
        {pathData ? (
          <>
            <path className="journey-route__track" d={pathData} />
            <path
              className="journey-route__path"
              d={pathData}
              stroke={`url(#${gradientId})`}
            />
          </>
        ) : null}
        {points.map((point, index) => (
          <circle
            key={`${point[0]}-${point[1]}-${index}`}
            className={`journey-route__node${
              index === points.length - 1 ? ' journey-route__node--end' : ''
            }`}
            cx={point[0]}
            cy={point[1]}
            r={index === 0 || index === points.length - 1 ? 2.8 : 1.6}
          />
        ))}
      </svg>
    </div>
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

  return (
    <article className="journey-card journey-card--move">
      <div className="journey-card__body">
        <div className="journey-card__meta">
          <span className="journey-status journey-status--arrived">MOVE</span>
          <span className="journey-card__date">{formatJourneyDate(journey.date)}</span>
        </div>
        <div className="journey-card__route">
          <span className="journey-card__city">{step.from}</span>
          <span className="journey-card__arrow" aria-hidden="true">
            →
          </span>
          <span className="journey-card__city">{step.to}</span>
        </div>
        <JourneyRouteMap step={step} />
        <div className="journey-card__transport">
          <span aria-hidden="true">{transport?.icon ?? '•'}</span>
          <span>{transport?.label ?? step.mode.toUpperCase()}</span>
          <span>{formatDistance(step.distanceKm)} km</span>
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
      </div>
    </article>
  )
}

const JourneyEpisodePage = ({
  step,
  journey,
}: {
  step: JourneyEpisodeStep
  journey: Journey
}) => {
  return (
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
        <div className="journey-card__meta">
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
}

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
        <div className="journey-card__meta">
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
                rows={3}
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

const JourneyPagePlaceholder = ({
  variant,
}: {
  variant: 'move' | 'story'
}) => (
  <div className="journey-page__placeholder">
    {variant === 'move'
      ? '移動ステップを選ぶとルートが表示されます。'
      : '思い出や記録のページはここに表示されます。'}
  </div>
)

export const JourneysScene = ({
  onAdvance,
  journeys,
  responses,
  saveResponse,
  setDistanceTraveled,
}: SceneComponentProps) => {
  const stepEntries = useMemo(() => buildStepEntries(journeys), [journeys])

  const [activeJourneyIndex, setActiveJourneyIndex] = useState(0)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')

  useEffect(() => {
    if (journeys.length === 0) {
      setActiveJourneyIndex(0)
      setActiveStepIndex(0)
      return
    }

    if (activeJourneyIndex >= journeys.length) {
      setActiveJourneyIndex(journeys.length - 1)
      setActiveStepIndex(0)
    }
  }, [activeJourneyIndex, journeys])

  useEffect(() => {
    const journey = journeys[activeJourneyIndex]
    if (!journey) {
      setActiveStepIndex(0)
      return
    }

    if (activeStepIndex >= journey.steps.length) {
      setActiveStepIndex(Math.max(journey.steps.length - 1, 0))
    }
  }, [activeJourneyIndex, activeStepIndex, journeys])

  const activeJourney = journeys[activeJourneyIndex]
  const activeStep = activeJourney?.steps[activeStepIndex]

  const activeEntry = useMemo(
    () =>
      stepEntries.find(
        (entry) =>
          entry.journeyIndex === activeJourneyIndex &&
          entry.stepIndex === activeStepIndex
      ),
    [activeJourneyIndex, activeStepIndex, stepEntries]
  )

  const latestMoveEntry = useMemo(
    () =>
      activeEntry
        ? findLatestEntry(stepEntries, activeEntry.globalIndex, (step) =>
            step.type === 'move'
          )
        : undefined,
    [activeEntry, stepEntries]
  )

  const latestStoryEntry = useMemo(
    () =>
      activeEntry
        ? findLatestEntry(stepEntries, activeEntry.globalIndex, (step) =>
            step.type !== 'move'
          )
        : undefined,
    [activeEntry, stepEntries]
  )

  const traveledDistance = useMemo(
    () => computeTraveledDistance(journeys, activeJourneyIndex, activeStepIndex),
    [journeys, activeJourneyIndex, activeStepIndex]
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

  const questionStorageKey = isQuestionStep(activeStep)
    ? activeStep.storageKey
    : null
  const storedResponse = questionStorageKey
    ? responseMap.get(questionStorageKey)
    : undefined

  const isQuestionReadOnly = isQuestionStep(activeStep)
    ? Boolean(storedResponse) && activeStep.readonlyAfterSave !== false
    : false

  useEffect(() => {
    if (isQuestionStep(activeStep)) {
      setDraftAnswer(storedResponse?.answer ?? '')
    } else {
      setDraftAnswer('')
    }
  }, [activeStep, storedResponse])

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!isQuestionStep(activeStep) || !activeJourney) {
        return
      }

      if (
        activeStep.readonlyAfterSave !== false &&
        storedResponse !== undefined
      ) {
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
          journeyId: activeJourney.id,
          stepId: activeStep.id,
          storageKey: activeStep.storageKey,
          prompt: activeStep.prompt,
          answer: value,
        })
      }
    },
    [activeJourney, activeStep, saveResponse, storedResponse]
  )

  const handleTextBlur = useCallback(() => {
    if (!isQuestionStep(activeStep) || !activeJourney) {
      return
    }

    if (activeStep.style !== 'text') {
      return
    }

    if (activeStep.readonlyAfterSave === false) {
      return
    }

    if (storedResponse !== undefined) {
      return
    }

    if (draftAnswer.trim().length === 0) {
      return
    }

    saveResponse({
      journeyId: activeJourney.id,
      stepId: activeStep.id,
      storageKey: activeStep.storageKey,
      prompt: activeStep.prompt,
      answer: draftAnswer,
    })
  }, [
    activeJourney,
    activeStep,
    draftAnswer,
    saveResponse,
    storedResponse,
  ])

  if (!activeJourney || !activeStep || !activeEntry) {
    return (
      <SceneLayout
        eyebrow="Journeys"
        title="旅の移動演出ログ"
        description="旅データを整備すると、ここに移動ページと思い出ページが並びます。"
      >
        <p className="scene-note">
          まだ旅のデータが登録されていません。`src/data/journeys.ts` にステップを追加すると紙芝居が完成します。
        </p>
      </SceneLayout>
    )
  }

  const leftStep = isMoveStep(latestMoveEntry?.step)
    ? latestMoveEntry.step
    : undefined
  const leftJourney = latestMoveEntry?.journey
  const rightStep = latestStoryEntry?.step
  const rightJourney = latestStoryEntry?.journey

  const isLeftActive = isMoveStep(activeStep)
  const isRightActive = !isLeftActive

  const rightQuestionStep = isQuestionStep(rightStep) ? rightStep : undefined
  const rightStoredResponse = rightQuestionStep
    ? responseMap.get(rightQuestionStep.storageKey)
    : undefined

  const rightValue = rightQuestionStep
    ? isRightActive
      ? draftAnswer
      : rightStoredResponse?.answer ?? ''
    : ''

  const rightLocked = rightQuestionStep
    ? isRightActive
      ? isQuestionReadOnly
      : true
    : false

  const stepCount = stepEntries.length
  const activeStepNumber = activeEntry.globalIndex + 1

  const headerSubtitle = (() => {
    if (!activeStep) {
      return ''
    }

    if (isMoveStep(activeStep)) {
      return `${activeStep.from} → ${activeStep.to}`
    }

    if (isEpisodeStep(activeStep)) {
      return activeStep.title ?? activeJourney.title
    }

    if (isQuestionStep(activeStep)) {
      return activeStep.prompt
    }

    return ''
  })()

  const headerDescription = (() => {
    if (!activeStep) {
      return ''
    }

    if (isMoveStep(activeStep)) {
      return activeStep.description ?? ''
    }

    if (isEpisodeStep(activeStep)) {
      return activeStep.text[0] ?? ''
    }

    if (isQuestionStep(activeStep)) {
      return activeStep.helper ?? ''
    }

    return ''
  })()

  const isFinalJourney =
    activeJourneyIndex === journeys.length - 1 && journeys.length > 0
  const isFinalStep =
    isFinalJourney && activeStepIndex === activeJourney.steps.length - 1

  const nextButtonLabel = isFinalStep
    ? 'Messagesへ進む'
    : activeStepIndex === activeJourney.steps.length - 1
      ? '次の旅へ'
      : '次のページ'

  const prevDisabled = activeJourneyIndex === 0 && activeStepIndex === 0

  const handlePrevStep = () => {
    if (!activeJourney) {
      return
    }

    if (activeStepIndex > 0) {
      setActiveStepIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (activeJourneyIndex === 0) {
      return
    }

    const nextJourneyIndex = activeJourneyIndex - 1
    const nextJourney = journeys[nextJourneyIndex]
    const nextStepIndex = Math.max((nextJourney?.steps.length ?? 1) - 1, 0)

    setActiveJourneyIndex(nextJourneyIndex)
    setActiveStepIndex(nextStepIndex)
  }

  const handleNextStep = () => {
    if (!activeJourney) {
      onAdvance()
      return
    }

    if (activeStepIndex < activeJourney.steps.length - 1) {
      setActiveStepIndex((index) => index + 1)
      return
    }

    if (activeJourneyIndex >= journeys.length - 1) {
      onAdvance()
      return
    }

    const nextJourneyIndex = activeJourneyIndex + 1
    setActiveJourneyIndex(nextJourneyIndex)
    setActiveStepIndex(0)
  }

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
              JOURNEY {activeJourneyIndex + 1} / {journeys.length}
            </span>
            <span className="journeys-header__step">
              STEP {activeStepNumber} / {stepCount}
            </span>
          </div>
          <h2 className="journeys-header__title">{activeJourney.title}</h2>
          <div className="journeys-header__meta">
            <span className="journeys-header__date">
              {formatJourneyDate(activeJourney.date)}
            </span>
            <span className="journeys-header__chip">
              {stepTypeLabel[activeStep.type]}
            </span>
            {leftStep ? (
              <span className="journeys-header__chip">
                <span aria-hidden="true">{transportMeta[leftStep.mode].icon}</span>
                {transportMeta[leftStep.mode].label}
              </span>
            ) : null}
          </div>
          {headerSubtitle ? (
            <p className="journeys-header__subtitle">{headerSubtitle}</p>
          ) : null}
          {headerDescription ? (
            <p className="journeys-header__description">{headerDescription}</p>
          ) : null}
        </header>

        <div className="journeys-stage journeys-stage--storybook">
          <div
            className={[
              'journey-page',
              'journey-page--left',
              leftStep ? (isLeftActive ? 'is-active' : 'is-dimmed') : 'is-empty',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {leftStep && leftJourney ? (
              <JourneyMovePage step={leftStep} journey={leftJourney} />
            ) : (
              <JourneyPagePlaceholder variant="move" />
            )}
          </div>
          <div
            className={[
              'journey-page',
              'journey-page--right',
              rightStep
                ? isRightActive
                  ? 'is-active'
                  : 'is-dimmed'
                : 'is-empty',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {rightStep && rightJourney ? (
              isEpisodeStep(rightStep) ? (
                <JourneyEpisodePage step={rightStep} journey={rightJourney} />
              ) : isQuestionStep(rightStep) ? (
                <JourneyQuestionPage
                  step={rightStep}
                  journey={rightJourney}
                  value={rightValue}
                  storedResponse={rightStoredResponse}
                  isActive={isRightActive}
                  isLocked={rightLocked}
                  onAnswerChange={isRightActive ? handleAnswerChange : undefined}
                  onTextBlur={isRightActive ? handleTextBlur : undefined}
                />
              ) : null
            ) : (
              <JourneyPagePlaceholder variant="story" />
            )}
          </div>
        </div>

        <nav className="journeys-nav" aria-label="Journeys navigation">
          <button
            type="button"
            className="journeys-nav__button"
            onClick={handlePrevStep}
            disabled={prevDisabled}
          >
            前のページ
          </button>
          <button
            type="button"
            className="journeys-nav__button journeys-nav__button--primary"
            onClick={handleNextStep}
          >
            {nextButtonLabel}
          </button>
        </nav>
      </div>
    </SceneLayout>
  )
}
