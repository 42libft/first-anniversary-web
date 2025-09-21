import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import { SceneLayout } from '../components/SceneLayout'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
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

const PLANE_ANIMATION_MS = 1600
const COMPLETION_EPSILON = 0.5

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

type MoveMeta = {
  stepId: string
  journeyId: string
  distanceKm: number
  cumulativeBefore: number
  cumulativeAfter: number
}

const buildMoveMetas = (journeyList: Journey[]): MoveMeta[] => {
  const result: MoveMeta[] = []
  let running = 0

  journeyList.forEach((journey) => {
    journey.steps.forEach((step) => {
      if (step.type === 'move') {
        const before = running
        running += step.distanceKm
        result.push({
          stepId: step.id,
          journeyId: journey.id,
          distanceKm: step.distanceKm,
          cumulativeBefore: before,
          cumulativeAfter: running,
        })
      }
    })
  })

  return result
}

const isMoveStep = (step: JourneyStep | undefined): step is JourneyMoveStep =>
  step?.type === 'move'

const isEpisodeStep = (
  step: JourneyStep | undefined
): step is JourneyEpisodeStep => step?.type === 'episode'

const isQuestionStep = (
  step: JourneyStep | undefined
): step is JourneyQuestionStep => step?.type === 'question'

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

  const moveMetas = useMemo(() => buildMoveMetas(journeys), [journeys])
  const moveMetaMap = useMemo(() => {
    const map = new Map<string, MoveMeta>()
    moveMetas.forEach((meta) => {
      map.set(meta.stepId, meta)
    })
    return map
  }, [moveMetas])

  const responseMap = useMemo(() => {
    const map = new Map<string, typeof responses[number]>()
    responses.forEach((entry) => {
      map.set(entry.storageKey, entry)
    })
    return map
  }, [responses])

  const [activeJourneyIndex, setActiveJourneyIndex] = useState(0)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [animationState, setAnimationState] = useState<
    'idle' | 'animating' | 'complete'
  >('idle')
  const animationTimeoutRef = useRef<number | null>(null)
  const [animationToken, setAnimationToken] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')

  useEffect(
    () => () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    },
    []
  )

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

  useEffect(() => {
    if (!isMoveStep(activeStep)) {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      setAnimationState('idle')
      return
    }

    const meta = moveMetaMap.get(activeStep.id)
    if (!meta) {
      setAnimationState('idle')
      return
    }

    if (distanceTraveled >= meta.cumulativeAfter - COMPLETION_EPSILON) {
      setAnimationState('complete')
    } else {
      setAnimationState('idle')
    }
  }, [activeStep, distanceTraveled, moveMetaMap])

  const completedDistance = Math.min(distanceTraveled, totalJourneyDistance)
  const remainingDistance = Math.max(totalJourneyDistance - completedDistance, 0)

  const progressPercent = totalJourneyDistance
    ? Math.min(100, Math.max(0, (completedDistance / totalJourneyDistance) * 100))
    : 0

  const moveMeta = isMoveStep(activeStep)
    ? moveMetaMap.get(activeStep.id)
    : undefined

  const isMoveCompleted = moveMeta
    ? completedDistance >= moveMeta.cumulativeAfter - COMPLETION_EPSILON
    : false

  const moveState: 'idle' | 'animating' | 'complete' = animationState

  const handleStartMove = () => {
    if (!isMoveStep(activeStep) || !activeJourney) {
      return
    }

    const meta = moveMetaMap.get(activeStep.id)
    if (!meta) {
      return
    }

    const finalize = () => {
      setDistanceTraveled((current) => {
        if (current >= meta.cumulativeAfter - COMPLETION_EPSILON) {
          return current
        }
        return Math.min(meta.cumulativeAfter, totalJourneyDistance)
      })
      setAnimationState('complete')
    }

    if (
      prefersReducedMotion ||
      completedDistance >= meta.cumulativeAfter - COMPLETION_EPSILON
    ) {
      finalize()
      return
    }

    setAnimationState('animating')
    setAnimationToken((token) => token + 1)

    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current)
    }

    animationTimeoutRef.current = window.setTimeout(() => {
      animationTimeoutRef.current = null
      finalize()
    }, PLANE_ANIMATION_MS)
  }

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

  if (!activeJourney || !activeStep) {
    return (
      <SceneLayout
        eyebrow="Journeys"
        title="移動演出と思い出ギャラリー"
        description="旅データを整備すると、ここに移動アニメーションと質問カードが並びます。"
      >
        <p className="scene-note">
          まだ旅のデータが登録されていません。`src/data/journeys.ts` にステップを追加してください。
        </p>
      </SceneLayout>
    )
  }

  const transportStep: JourneyMoveStep | undefined = isMoveStep(activeStep)
    ? activeStep
    : (activeJourney.steps.find((step) => step.type === 'move') as
        | JourneyMoveStep
        | undefined)

  const transport = transportStep
    ? transportMeta[transportStep.mode]
    : undefined

  const statusLabel = (() => {
    if (!isMoveStep(activeStep)) {
      return ''
    }

    if (animationState === 'animating') {
      return '移動中…'
    }

    if (isMoveCompleted) {
      return '到着済み — 記録を残そう'
    }

    if (activeStep.mode === 'flight' && activeStep.meta?.flightNo) {
      const times = [activeStep.meta.dep, activeStep.meta.arr]
        .filter(Boolean)
        .join(' → ')
      return times
        ? `${activeStep.meta.flightNo} ${times} (タップ)`
        : `${activeStep.meta.flightNo} (タップ)`
    }

    return `${activeStep.from} → ${activeStep.to} を開始 (タップ)`
  })()

  const isFinalJourney =
    activeJourneyIndex === journeys.length - 1 && journeys.length > 0
  const isFinalStep =
    isFinalJourney && activeStepIndex === activeJourney.steps.length - 1

  const nextButtonLabel = isFinalStep
    ? 'Messagesへ進む'
    : activeStepIndex === activeJourney.steps.length - 1
      ? '次の旅へ'
      : '次のステップ'

  const prevDisabled = activeJourneyIndex === 0 && activeStepIndex === 0
  const nextDisabled = isMoveStep(activeStep) && !isMoveCompleted

  const planeStyle: CSSProperties | undefined =
    isMoveStep(activeStep) && activeStep.mode === 'flight'
      ? {
          ['--plane-from-x' as string]: `${activeStep.fromCoord?.[0] ?? 12}%`,
          ['--plane-from-y' as string]: `${activeStep.fromCoord?.[1] ?? 50}%`,
          ['--plane-to-x' as string]: `${activeStep.toCoord?.[0] ?? 88}%`,
          ['--plane-to-y' as string]: `${activeStep.toCoord?.[1] ?? 50}%`,
        }
      : undefined

  const routePoints =
    isMoveStep(activeStep) && activeStep.mode !== 'flight'
      ? getRoutePoints(activeStep)
      : []
  const routePath =
    isMoveStep(activeStep) && activeStep.mode !== 'flight'
      ? toRoutePath(routePoints)
      : ''

  const routeStart = routePoints[0]
  const routeEnd = routePoints[routePoints.length - 1]

  return (
    <SceneLayout
      eyebrow="Journeys"
      title="旅の移動演出ログ"
      description="この一年で実際に会いに行った旅を、移動演出とエピソード、質問で振り返ります。"
    >
      <div className="journeys-experience">
        <header className="journeys-header">
          <div className="journeys-header__row">
            <span className="journeys-header__label">
              JOURNEY {activeJourneyIndex + 1}/{journeys.length}
            </span>
            <span className="journeys-header__distance">
              累計 {formatDistance(completedDistance)} km
            </span>
          </div>
          <h2 className="journeys-header__title">{activeJourney.title}</h2>
          <p className="journeys-header__step">
            STEP {activeStepIndex + 1}/{activeJourney.steps.length} ·{' '}
            {stepTypeLabel[activeStep.type]}
          </p>
          <div className="journeys-header__meta">
            <span className="journeys-header__date">
              {formatJourneyDate(activeJourney.date)}
            </span>
            {transport ? (
              <span className="journeys-header__mode">
                <span aria-hidden="true">{transport.icon}</span>
                {transport.label}
              </span>
            ) : null}
          </div>
          <div className="journeys-progress-bar" aria-hidden="true">
            <div
              className="journeys-progress-bar__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="journeys-step-indicator" aria-hidden="true">
            {activeJourney.steps.map((step, index) => {
              const className = [
                'journeys-step-indicator__dot',
                index === activeStepIndex
                  ? 'is-current'
                  : index < activeStepIndex
                    ? 'is-complete'
                    : '',
              ]
                .filter(Boolean)
                .join(' ')

              return <span key={step.id} className={className} />
            })}
          </div>
          <div className="journeys-header__secondary">
            <span>残り {formatDistance(remainingDistance)} km</span>
            <span>
              {isMoveCompleted
                ? `到着済み: ${formatDistance(
                    moveMeta?.cumulativeAfter ?? completedDistance
                  )} km`
                : `出発前: ${formatDistance(
                    moveMeta?.cumulativeBefore ?? completedDistance
                  )} km`}
            </span>
          </div>
        </header>

        <div className="journeys-stage">
          {isMoveStep(activeStep) ? (
            <>
              <button
                type="button"
                className={`journey-map${
                  activeStep.mode !== 'flight' ? ' journey-map--route' : ''
                }`}
                onClick={handleStartMove}
                disabled={animationState === 'animating'}
                aria-live="polite"
                aria-label={`${activeStep.from}から${activeStep.to}への移動を開始`}
                style={{ background: getArtBackground(activeStep.artKey) }}
              >
                <span className="journey-map__glow" aria-hidden="true" />
                {activeStep.mode === 'flight' ? (
                  <div className="journey-map__line" aria-hidden="true">
                    <span className="journey-map__line-track" />
                    <span
                      key={`progress-${activeStep.id}-${animationToken}-${moveState}`}
                      className="journey-map__line-progress"
                      data-state={moveState}
                    />
                  </div>
                ) : (
                  <div className="journey-map__route-visual" aria-hidden="true">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                      <path className="journey-map__route-track" d={routePath} />
                      <path
                        key={`route-${activeStep.id}-${animationToken}-${moveState}`}
                        className="journey-map__route-progress"
                        data-state={moveState}
                        d={routePath}
                      />
                      {routeStart ? (
                        <circle
                          className="journey-map__route-node"
                          cx={routeStart[0]}
                          cy={routeStart[1]}
                          r={2.2}
                        />
                      ) : null}
                      {routeEnd ? (
                        <circle
                          className="journey-map__route-node journey-map__route-node--end"
                          cx={routeEnd[0]}
                          cy={routeEnd[1]}
                          r={2.8}
                        />
                      ) : null}
                    </svg>
                  </div>
                )}
                <span
                  key={`plane-${activeStep.id}-${animationToken}-${moveState}`}
                  className={`journey-map__plane${
                    activeStep.mode !== 'flight'
                      ? ' journey-map__plane--route'
                      : ''
                  }${
                    prefersReducedMotion && moveState === 'complete'
                      ? ' journey-map__plane--static'
                      : ''
                  }`}
                  data-state={moveState}
                  aria-hidden="true"
                  style={planeStyle}
                >
                  {activeStep.mode === 'flight' ? (
                    <svg viewBox="0 0 60 32" role="img" aria-hidden="true">
                      <path
                        d="M2 14h24l8-10h7l-7 10h18l4 2-4 2H34l7 10h-7l-8-10H2l-2-2z"
                        fill="url(#planeGradient)"
                      />
                      <defs>
                        <linearGradient
                          id="planeGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#ff66c4" />
                          <stop offset="100%" stopColor="#4d7bff" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ) : (
                    <span className="journey-map__route-icon" aria-hidden="true">
                      {transport?.icon ?? '•'}
                    </span>
                  )}
                </span>
                <div className="journey-map__labels" aria-hidden="true">
                  <span>{activeStep.from}</span>
                  <span>{activeStep.to}</span>
                </div>
                <span className="journey-map__status">{statusLabel}</span>
              </button>

              <article className="journey-card journey-card--move">
                <div className="journey-card__body">
                  <div className="journey-card__meta">
                    <span
                      className={`journey-status journey-status--${
                        isMoveCompleted ? 'arrived' : 'pending'
                      }`}
                    >
                      {isMoveCompleted ? 'ARRIVED' : 'READY'}
                    </span>
                    <span className="journey-card__date">
                      {formatJourneyDate(activeJourney.date)}
                    </span>
                  </div>
                  <div className="journey-card__route">
                    <span className="journey-card__city">{activeStep.from}</span>
                    <span className="journey-card__arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="journey-card__city">{activeStep.to}</span>
                  </div>
                  <div className="journey-card__transport">
                    <span aria-hidden="true">{transport?.icon}</span>
                    <span>{transport?.label}</span>
                    <span>{formatDistance(activeStep.distanceKm)} km</span>
                  </div>
                  <p className="journey-card__caption">
                    {activeStep.description ?? activeJourney.title}
                  </p>
                  <div className="journey-card__stats">
                    <div>
                      <p className="journey-card__stat-label">今回の移動距離</p>
                      <p className="journey-card__stat-value">
                        {formatDistance(activeStep.distanceKm)} km
                      </p>
                    </div>
                    <div>
                      <p className="journey-card__stat-label">
                        {isMoveCompleted
                          ? '累計距離 (到着済み)'
                          : '累計距離 (出発前)'}
                      </p>
                      <p className="journey-card__stat-value">
                        {formatDistance(
                          isMoveCompleted
                            ? moveMeta?.cumulativeAfter ?? completedDistance
                            : moveMeta?.cumulativeBefore ?? completedDistance
                        )}{' '}
                        km
                      </p>
                    </div>
                  </div>
                  {activeStep.meta ? (
                    <dl className="journey-card__meta-grid">
                      {activeStep.meta.flightNo ? (
                        <div>
                          <dt>便名</dt>
                          <dd>{activeStep.meta.flightNo}</dd>
                        </div>
                      ) : null}
                      {activeStep.meta.dep ? (
                        <div>
                          <dt>出発</dt>
                          <dd>{activeStep.meta.dep}</dd>
                        </div>
                      ) : null}
                      {activeStep.meta.arr ? (
                        <div>
                          <dt>到着</dt>
                          <dd>{activeStep.meta.arr}</dd>
                        </div>
                      ) : null}
                      {activeStep.meta.note ? (
                        <div className="journey-card__meta-note">
                          <dt>NOTE</dt>
                          <dd>{activeStep.meta.note}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              </article>
            </>
          ) : null}

          {isEpisodeStep(activeStep) ? (
            <article className="journey-card journey-card--episode">
              <div
                className="journey-card__media"
                style={{ background: getArtBackground(activeStep.artKey) }}
              >
                <img
                  className="journey-card__photo"
                  src={activeStep.photo.src}
                  alt={activeStep.photo.alt}
                  loading="lazy"
                  style={
                    activeStep.photo.objectPosition
                      ? { objectPosition: activeStep.photo.objectPosition }
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
                  <span className="journey-status journey-status--arrived">
                    EPISODE
                  </span>
                  <span className="journey-card__date">
                    {formatJourneyDate(activeJourney.date)}
                  </span>
                </div>
                {activeStep.title ? (
                  <h3 className="journey-card__episode-title">
                    {activeStep.title}
                  </h3>
                ) : null}
                <div className="journey-card__text-group">
                  {activeStep.text.map((paragraph, index) => (
                    <p key={index} className="journey-card__caption">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ) : null}

          {isQuestionStep(activeStep) ? (
            <article className="journey-card journey-card--question">
              <div className="journey-card__body">
                <div className="journey-card__meta">
                  <span className="journey-status journey-status--arrived">
                    RECORD
                  </span>
                  <span className="journey-card__date">
                    {formatJourneyDate(activeJourney.date)}
                  </span>
                </div>
                <div className="journey-prompts journey-prompts--single">
                  <div className="journey-prompt" role="group">
                    <span className="journey-prompt__question">
                      {activeStep.prompt}
                    </span>
                    {activeStep.helper ? (
                      <span className="journey-prompt__helper">
                        {activeStep.helper}
                      </span>
                    ) : null}
                    {activeStep.style === 'choice' ? (
                      <div className="journey-prompt__choices">
                        {(activeStep.choices ?? []).map((choice) => {
                          const isSelected = draftAnswer === choice
                          return (
                            <button
                              key={choice}
                              type="button"
                              className={`journey-choice${
                                isSelected ? ' is-selected' : ''
                              }${
                                isQuestionReadOnly ? ' is-locked' : ''
                              }`}
                              onClick={() => handleAnswerChange(choice)}
                              disabled={isQuestionReadOnly}
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
                        id={activeStep.id}
                        className="journey-prompt__input"
                        value={draftAnswer}
                        placeholder={
                          activeStep.placeholder ?? 'ここに感じたことをメモ'
                        }
                        onChange={(event) =>
                          handleAnswerChange(event.currentTarget.value)
                        }
                        onBlur={handleTextBlur}
                        disabled={isQuestionReadOnly}
                        rows={3}
                      />
                    )}
                    <div className="journey-prompt__footer">
                      <span className="journey-prompt__status">
                        {storedResponse?.recordedAt
                          ? `記録: ${formatRecordedAt(
                              storedResponse.recordedAt
                            )}`
                          : '未記録'}
                      </span>
                      {isQuestionReadOnly ? (
                        <span className="journey-prompts__locked">
                          保存済みのため編集できません。
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>

        <nav className="journeys-nav" aria-label="Journeys navigation">
          <button
            type="button"
            className="journeys-nav__button"
            onClick={handlePrevStep}
            disabled={prevDisabled}
          >
            前のステップ
          </button>
          <button
            type="button"
            className="journeys-nav__button journeys-nav__button--primary"
            onClick={handleNextStep}
            disabled={nextDisabled}
          >
            {nextButtonLabel}
          </button>
        </nav>
      </div>
    </SceneLayout>
  )
}
