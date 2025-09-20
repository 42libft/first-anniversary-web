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
  JourneyCoordinate,
  JourneyEpisodeStep,
  JourneyMoveMode,
  JourneyMoveStep,
  JourneyQuestionStep,
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

const stepTypeLabel: Record<'move' | 'memory', string> = {
  move: '移動',
  memory: '思い出',
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

type JourneyDisplayStep =
  | { kind: 'move'; move: JourneyMoveStep }
  | { kind: 'memory'; episode: JourneyEpisodeStep; questions: JourneyQuestionStep[] }

const isMoveDisplayStep = (
  step: JourneyDisplayStep | undefined
): step is { kind: 'move'; move: JourneyMoveStep } => step?.kind === 'move'

const isMemoryDisplayStep = (
  step: JourneyDisplayStep | undefined
): step is { kind: 'memory'; episode: JourneyEpisodeStep; questions: JourneyQuestionStep[] } =>
  step?.kind === 'memory'

const buildDisplaySteps = (journey: Journey): JourneyDisplayStep[] => {
  const displaySteps: JourneyDisplayStep[] = []

  for (let index = 0; index < journey.steps.length; index += 1) {
    const step = journey.steps[index]
    if (step.type === 'move') {
      displaySteps.push({ kind: 'move', move: step })
      continue
    }

    if (step.type === 'episode') {
      const questions: JourneyQuestionStep[] = []
      let lookahead = index + 1

      while (lookahead < journey.steps.length) {
        const nextStep = journey.steps[lookahead]
        if (nextStep.type === 'question') {
          questions.push(nextStep)
          lookahead += 1
          continue
        }
        break
      }

      displaySteps.push({ kind: 'memory', episode: step, questions })
      index = lookahead - 1
      continue
    }

    if (step.type === 'question') {
      const previous = displaySteps[displaySteps.length - 1]
      if (previous && previous.kind === 'memory') {
        previous.questions.push(step)
      } else {
        displaySteps.push({
          kind: 'memory',
          episode: {
            id: `${step.id}-memory`,
            type: 'episode',
            title: journey.title,
            text: [step.prompt],
            photo: {
              src: '',
              alt: '',
            },
          },
          questions: [step],
        })
      }
    }
  }

  return displaySteps
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
  const [memoryIntroVisible, setMemoryIntroVisible] = useState(false)
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

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

  const activeJourney = journeys[activeJourneyIndex]

  const displaySteps = useMemo(
    () => (activeJourney ? buildDisplaySteps(activeJourney) : []),
    [activeJourney]
  )

  useEffect(() => {
    if (!activeJourney) {
      setActiveStepIndex(0)
      return
    }

    if (activeStepIndex >= displaySteps.length) {
      setActiveStepIndex(Math.max(displaySteps.length - 1, 0))
    }
  }, [activeJourney, activeStepIndex, displaySteps.length])

  const activeStep = displaySteps[activeStepIndex]

  useEffect(() => {
    if (isMemoryDisplayStep(activeStep)) {
      setMemoryIntroVisible(true)
    } else {
      setMemoryIntroVisible(false)
    }
  }, [activeStep])

  useEffect(() => {
    if (!activeJourney) {
      return
    }

    setDraftAnswers((prev) => {
      let changed = false
      const nextDrafts = { ...prev }

      activeJourney.steps.forEach((step) => {
        if (step.type !== 'question') {
          return
        }

        const stored = responseMap.get(step.storageKey)
        if (stored) {
          if (nextDrafts[step.id] !== stored.answer) {
            nextDrafts[step.id] = stored.answer
            changed = true
          }
          return
        }

        if (!(step.id in nextDrafts)) {
          nextDrafts[step.id] = ''
          changed = true
        }
      })

      return changed ? nextDrafts : prev
    })
  }, [activeJourney, responseMap])

  const moveStep = isMoveDisplayStep(activeStep) ? activeStep.move : undefined
  const memoryStep = isMemoryDisplayStep(activeStep) ? activeStep : undefined

  useEffect(() => {
    if (!moveStep) {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      setAnimationState('idle')
      return
    }

    const meta = moveMetaMap.get(moveStep.id)
    if (!meta) {
      setAnimationState('idle')
      return
    }

    if (distanceTraveled >= meta.cumulativeAfter - COMPLETION_EPSILON) {
      setAnimationState('complete')
    } else {
      setAnimationState('idle')
    }
  }, [moveStep, distanceTraveled, moveMetaMap])

  const completedDistance = Math.min(distanceTraveled, totalJourneyDistance)

  const progressPercent = totalJourneyDistance
    ? Math.min(100, Math.max(0, (completedDistance / totalJourneyDistance) * 100))
    : 0

  const moveMeta = moveStep ? moveMetaMap.get(moveStep.id) : undefined

  const isMoveCompleted = moveMeta
    ? completedDistance >= moveMeta.cumulativeAfter - COMPLETION_EPSILON
    : false

  const transport = moveStep ? transportMeta[moveStep.mode] : undefined

  const statusLabel = (() => {
    if (!moveStep) {
      return ''
    }

    if (animationState === 'animating') {
      return '移動中…'
    }

    if (isMoveCompleted) {
      return '到着済み — 思い出をめくろう'
    }

    if (moveStep.mode === 'flight' && moveStep.meta?.flightNo) {
      const times = [moveStep.meta.dep, moveStep.meta.arr]
        .filter(Boolean)
        .join(' → ')
      return times
        ? `${moveStep.meta.flightNo} ${times} (タップ)`
        : `${moveStep.meta.flightNo} (タップ)`
    }

    return `${moveStep.from} → ${moveStep.to} を開始 (タップ)`
  })()

  const handleStartMove = () => {
    if (!moveStep) {
      return
    }

    const meta = moveMetaMap.get(moveStep.id)
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
    const nextDisplaySteps = buildDisplaySteps(nextJourney)

    setActiveJourneyIndex(nextJourneyIndex)
    setActiveStepIndex(Math.max(nextDisplaySteps.length - 1, 0))
  }

  const handleNextStep = () => {
    if (!activeJourney) {
      onAdvance()
      return
    }

    if (memoryStep && memoryIntroVisible) {
      setMemoryIntroVisible(false)
      return
    }

    if (activeStepIndex < displaySteps.length - 1) {
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

  const handleRevealMemory = () => {
    if (!memoryStep) {
      return
    }
    setMemoryIntroVisible(false)
  }

  const handleQuestionDraftChange = useCallback((questionId: string, value: string) => {
    setDraftAnswers((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const handleQuestionSave = useCallback(
    (question: JourneyQuestionStep) => {
      if (!activeJourney) {
        return
      }

      const answer = draftAnswers[question.id] ?? ''
      if (!answer.trim()) {
        return
      }

      saveResponse({
        journeyId: activeJourney.id,
        stepId: question.id,
        storageKey: question.storageKey,
        prompt: question.prompt,
        answer,
      })
    },
    [activeJourney, draftAnswers, saveResponse]
  )

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

  const isFinalJourney =
    activeJourneyIndex === journeys.length - 1 && journeys.length > 0
  const isFinalStep =
    isFinalJourney && activeStepIndex === displaySteps.length - 1

  const baseNextLabel = isFinalStep
    ? 'Messagesへ進む'
    : activeStepIndex === displaySteps.length - 1
      ? '次の旅へ'
      : '次のページ'

  const nextButtonLabel =
    memoryStep && memoryIntroVisible ? '思い出をひらく' : baseNextLabel

  const prevDisabled = activeJourneyIndex === 0 && activeStepIndex === 0
  const nextDisabled =
    isMoveDisplayStep(activeStep) && !isMoveCompleted

  const planeStyle: CSSProperties | undefined =
    moveStep && moveStep.mode === 'flight'
      ? {
          ['--plane-from-x' as string]: `${moveStep.fromCoord?.[0] ?? 12}%`,
          ['--plane-from-y' as string]: `${moveStep.fromCoord?.[1] ?? 50}%`,
          ['--plane-to-x' as string]: `${moveStep.toCoord?.[0] ?? 88}%`,
          ['--plane-to-y' as string]: `${moveStep.toCoord?.[1] ?? 50}%`,
        }
      : undefined

  const routePoints =
    moveStep && moveStep.mode !== 'flight' ? getRoutePoints(moveStep) : []
  const routePath =
    moveStep && moveStep.mode !== 'flight' ? toRoutePath(routePoints) : ''

  const routeStart = routePoints[0]
  const routeEnd = routePoints[routePoints.length - 1]

  const headerMode = transport
    ? transport
    : memoryStep
      ? { icon: '📖', label: 'MEMORY' }
      : undefined

  return (
    <SceneLayout
      eyebrow="Journeys"
      title="旅の移動演出ログ"
      description="この一年で実際に会いに行った旅を、移動演出と思い出で振り返ります。"
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
            PAGE {activeStepIndex + 1}/{displaySteps.length} ·{' '}
            {stepTypeLabel[activeStep.kind]}
          </p>
          <div className="journeys-header__meta">
            <span className="journeys-header__date">
              {formatJourneyDate(activeJourney.date)}
            </span>
            {headerMode ? (
              <span className="journeys-header__mode">
                <span aria-hidden="true">{headerMode.icon}</span>
                {headerMode.label}
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
            {displaySteps.map((step, index) => {
              const key =
                step.kind === 'move' ? step.move.id : step.episode.id
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

              return <span key={key} className={className} />
            })}
          </div>
        </header>

        <div className="journeys-stage">
          {moveStep ? (
            <>
              <button
                type="button"
                className={`journey-map${
                  moveStep.mode !== 'flight' ? ' journey-map--route' : ''
                }`}
                onClick={handleStartMove}
                disabled={animationState === 'animating'}
                aria-live="polite"
                aria-label={`${moveStep.from}から${moveStep.to}への移動を開始`}
                style={{ background: getArtBackground(moveStep.artKey) }}
              >
                <span className="journey-map__glow" aria-hidden="true" />
                {moveStep.mode === 'flight' ? (
                  <div className="journey-map__line" aria-hidden="true">
                    <span className="journey-map__line-track" />
                    <span
                      key={`progress-${moveStep.id}-${animationToken}-${animationState}`}
                      className="journey-map__line-progress"
                      data-state={animationState}
                    />
                  </div>
                ) : (
                  <div className="journey-map__route-visual" aria-hidden="true">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                      <path className="journey-map__route-track" d={routePath} />
                      <path
                        key={`route-${moveStep.id}-${animationToken}-${animationState}`}
                        className="journey-map__route-progress"
                        data-state={animationState}
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
                  key={`plane-${moveStep.id}-${animationToken}-${animationState}`}
                  className={`journey-map__plane${
                    moveStep.mode !== 'flight'
                      ? ' journey-map__plane--route'
                      : ''
                  }${
                    prefersReducedMotion && animationState === 'complete'
                      ? ' journey-map__plane--static'
                      : ''
                  }`}
                  data-state={animationState}
                  aria-hidden="true"
                  style={planeStyle}
                >
                  {moveStep.mode === 'flight' ? (
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
                  <span>{moveStep.from}</span>
                  <span>{moveStep.to}</span>
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
                    <span className="journey-card__city">{moveStep.from}</span>
                    <span className="journey-card__arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="journey-card__city">{moveStep.to}</span>
                  </div>
                  <div className="journey-card__transport">
                    <span aria-hidden="true">{transport?.icon}</span>
                    <span>{transport?.label}</span>
                    <span>{formatDistance(moveStep.distanceKm)} km</span>
                  </div>
                  <p className="journey-card__caption">
                    {moveStep.description ?? activeJourney.title}
                  </p>
                  <div className="journey-card__stats">
                    <div>
                      <p className="journey-card__stat-label">今回の移動距離</p>
                      <p className="journey-card__stat-value">
                        {formatDistance(moveStep.distanceKm)} km
                      </p>
                    </div>
                    <div>
                      <p className="journey-card__stat-label">累計距離</p>
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
                  {moveStep.meta ? (
                    <dl className="journey-card__meta-grid">
                      {moveStep.meta.flightNo ? (
                        <div>
                          <dt>便名</dt>
                          <dd>{moveStep.meta.flightNo}</dd>
                        </div>
                      ) : null}
                      {moveStep.meta.dep ? (
                        <div>
                          <dt>発</dt>
                          <dd>{moveStep.meta.dep}</dd>
                        </div>
                      ) : null}
                      {moveStep.meta.arr ? (
                        <div>
                          <dt>到着</dt>
                          <dd>{moveStep.meta.arr}</dd>
                        </div>
                      ) : null}
                      {moveStep.meta.note ? (
                        <div className="journey-card__meta-note">
                          <dt>NOTE</dt>
                          <dd>{moveStep.meta.note}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              </article>
            </>
          ) : null}

          {memoryStep ? (
            memoryIntroVisible ? (
              <button
                type="button"
                className="journey-memory-intro"
                onClick={handleRevealMemory}
              >
                <span className="journey-memory-intro__subtitle">
                  {formatJourneyDate(activeJourney.date)}
                </span>
                <span className="journey-memory-intro__title">
                  {activeJourney.title}
                </span>
                <span className="journey-memory-intro__hint">
                  タップで思い出をひらく
                </span>
              </button>
            ) : (
              <article className="journey-card journey-card--memory">
                {memoryStep.episode.photo?.src ? (
                  <div
                    className="journey-card__media"
                    style={{
                      background: getArtBackground(memoryStep.episode.artKey),
                    }}
                  >
                    <img
                      className="journey-card__photo"
                      src={memoryStep.episode.photo.src}
                      alt={memoryStep.episode.photo.alt}
                      loading="lazy"
                      style={{
                        objectPosition:
                          memoryStep.episode.photo.objectPosition ?? 'center',
                      }}
                    />
                    <span className="journey-card__badge">
                      <span className="journey-card__badge-icon" aria-hidden="true">
                        📖
                      </span>
                      MEMORY
                    </span>
                  </div>
                ) : null}
                <div className="journey-card__body">
                  <div className="journey-card__meta">
                    <span className="journey-status journey-status--arrived">
                      MEMORY
                    </span>
                    <span className="journey-card__date">
                      {formatJourneyDate(activeJourney.date)}
                    </span>
                  </div>
                  <span className="journey-memory__journey">{activeJourney.title}</span>
                  {memoryStep.episode.title ? (
                    <h3 className="journey-card__episode-title">
                      {memoryStep.episode.title}
                    </h3>
                  ) : null}
                  <div className="journey-card__text-group">
                    {memoryStep.episode.text
                      .filter((paragraph) => paragraph.trim().length > 0)
                      .map((paragraph, index) => (
                        <p key={index} className="journey-card__caption">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                  {memoryStep.questions.length ? (
                    <div className="journey-memory__questions">
                      <h4 className="journey-memory__questions-title">
                        記録ノート
                      </h4>
                      <div className="journey-prompts">
                        {memoryStep.questions.map((question) => {
                          const stored = responseMap.get(question.storageKey)
                          const draft = draftAnswers[question.id] ?? ''
                          const isLocked =
                            question.readonlyAfterSave !== false && Boolean(stored)

                          const handleChoiceSelect = (choice: string) => {
                            if (isLocked) {
                              return
                            }
                            handleQuestionDraftChange(question.id, choice)
                          }

                          const handleInputChange = (
                            value: string
                          ) => {
                            if (isLocked) {
                              return
                            }
                            handleQuestionDraftChange(question.id, value)
                          }

                          const handleSaveClick = () => {
                            if (isLocked) {
                              return
                            }
                            handleQuestionSave(question)
                          }

                          const canSave = !isLocked && draft.trim().length > 0

                          return (
                            <div
                              key={question.id}
                              className="journey-prompt"
                              role="group"
                              aria-labelledby={`${question.id}-prompt`}
                            >
                              <span
                                id={`${question.id}-prompt`}
                                className="journey-prompt__question"
                              >
                                {question.prompt}
                              </span>
                              {question.helper ? (
                                <span className="journey-prompt__helper">
                                  {question.helper}
                                </span>
                              ) : null}
                              {question.style === 'choice' ? (
                                <div className="journey-prompt__choices">
                                  {(question.choices ?? []).map((choice) => {
                                    const isSelected = draft === choice
                                    return (
                                      <button
                                        key={choice}
                                        type="button"
                                        className={`journey-choice${
                                          isSelected ? ' is-selected' : ''
                                        }${isLocked ? ' is-locked' : ''}`}
                                        onClick={() => handleChoiceSelect(choice)}
                                        disabled={isLocked}
                                      >
                                        <span
                                          className="journey-choice__icon"
                                          aria-hidden="true"
                                        >
                                          {isSelected ? '●' : '○'}
                                        </span>
                                        <span className="journey-choice__label">
                                          {choice}
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              ) : (
                                <textarea
                                  id={question.id}
                                  className="journey-prompt__input"
                                  value={draft}
                                  placeholder={
                                    question.placeholder ?? 'ここに感じたことをメモ'
                                  }
                                  onChange={(event) =>
                                    handleInputChange(event.currentTarget.value)
                                  }
                                  disabled={isLocked}
                                  rows={4}
                                />
                              )}
                              <div className="journey-prompt__footer">
                                <span className="journey-prompt__status">
                                  {stored?.recordedAt
                                    ? `記録: ${formatRecordedAt(
                                        stored.recordedAt
                                      )}`
                                    : '未記録'}
                                </span>
                                <div className="journey-prompt__actions">
                                  {isLocked ? (
                                    <span className="journey-prompts__locked">
                                      保存済みのため編集できません。
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="journey-prompt__save"
                                      onClick={handleSaveClick}
                                      disabled={!canSave}
                                    >
                                      記録する
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          ) : null}
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
            disabled={nextDisabled}
          >
            {nextButtonLabel}
          </button>
        </nav>
      </div>
    </SceneLayout>
  )
}

