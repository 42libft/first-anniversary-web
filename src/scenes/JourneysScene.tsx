import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import type {
  Journey,
  JourneyCoordinate,
  JourneyEpisodeStep,
  JourneyMoveMode,
  JourneyMoveStep,
  JourneyQuestionStep,
} from '../types/journey'
import type { SceneComponentProps } from '../types/scenes'
import { useHistoryTrackedState } from '../history/useHistoryTrackedState'

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

const formatJourneyDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return dateFormatter.format(date)
}

const formatRecordedAt = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return timestampFormatter.format(date)
}

const transportMeta: Record<JourneyMoveMode, { label: string; icon: string }> = {
  flight: { label: 'FLIGHT', icon: '✈️' },
  walk: { label: 'WALK', icon: '🚶' },
  bus: { label: 'BUS', icon: '🚌' },
  train: { label: 'TRAIN', icon: '🚆' },
}

const defaultRoute: JourneyCoordinate[] = [
  [12, 78],
  [28, 66],
  [50, 54],
  [72, 42],
  [88, 28],
]

const getRoutePoints = (step: JourneyMoveStep): JourneyCoordinate[] => {
  if (step.route && step.route.length >= 2) return step.route
  if (step.fromCoord && step.toCoord) return [step.fromCoord, step.toCoord]
  return defaultRoute
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const createFlightRoutePath = (from: JourneyCoordinate, to: JourneyCoordinate): string => {
  const [x1, y1] = from
  const [x2, y2] = to
  const midX = (x1 + x2) / 2
  const distance = Math.hypot(x2 - x1, y2 - y1)
  const arcHeight = clamp(Math.min(y1, y2) - distance * 0.18, 5, 95)
  return `M ${x1} ${y1} Q ${midX} ${arcHeight} ${x2} ${y2}`
}

const toRoutePath = (points: JourneyCoordinate[]): string => {
  if (!points.length) return ''
  const [first, ...rest] = points
  return rest.reduce((acc, point) => `${acc} L ${point[0]} ${point[1]}`, `M ${first[0]} ${first[1]}`)
}

const resolveAssetPath = (path: string): string => {
  if (!path) return path
  if (path.startsWith('data:')) return path
  if (/^(?:https?:)?\/\//.test(path)) return path
  const base = import.meta.env.BASE_URL ?? '/'
  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${sanitizedBase}${normalizedPath}`
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
            <path className="journey-route__path" d={pathData} stroke={`url(#${gradientId})`} />
          </>
        ) : null}
        {points.map((point, index) => (
          <circle
            key={`${point[0]}-${point[1]}-${index}`}
            className={`journey-route__node${index === points.length - 1 ? ' journey-route__node--end' : ''}`}
            cx={point[0]}
            cy={point[1]}
            r={index === 0 || index === points.length - 1 ? 2.8 : 1.6}
          />
        ))}
      </svg>
    </div>
  )
}

// Single-view cards
const TitleCard = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <article className="journeys-card journeys-card--intro" tabIndex={-1}>
    <p className="journeys-card__eyebrow">{eyebrow}</p>
    <h3 className="journeys-card__title">{title}</h3>
  </article>
)
const MoveCard = ({ step, journey }: { step: JourneyMoveStep; journey: Journey }) => {
  const transport = transportMeta[step.mode]
  const mapImageSrc = step.mapImage ? resolveAssetPath(step.mapImage.src) : undefined
  return (
    <article className="journeys-card journeys-card--move" tabIndex={-1}>
      <p className="journeys-card__eyebrow">MOVE</p>
      <h3 className="journeys-card__title">
        {step.from} → {step.to}
      </h3>
      <div className="journeys-card__meta">
        <span className="journeys-card__tag" aria-label="Transport">
          <span aria-hidden="true">{transport?.icon ?? '•'}</span>
          {transport?.label ?? step.mode.toUpperCase()}
        </span>
        <span className="journeys-card__tag" aria-label="Date">
          {formatJourneyDate(journey.date)}
        </span>
      </div>
      <figure className="journeys-card__figure journeys-card__figure--map">
        {step.mapImage && mapImageSrc ? (
          <img
            className="journeys-map journeys-map--image"
            src={mapImageSrc}
            alt={step.mapImage.alt}
            loading="lazy"
          />
        ) : (
          <JourneyRouteMap step={step} />
        )}
      </figure>
      {step.description ? (
        <p className="journeys-card__description">{step.description}</p>
      ) : null}
      {step.meta ? (
        <dl className="journeys-card__details">
          {step.meta.flightNo ? (
            <div className="journeys-card__detail">
              <dt>便名</dt>
              <dd>{step.meta.flightNo}</dd>
            </div>
          ) : null}
          {step.meta.dep ? (
            <div className="journeys-card__detail">
              <dt>出発</dt>
              <dd>{step.meta.dep}</dd>
            </div>
          ) : null}
          {step.meta.arr ? (
            <div className="journeys-card__detail">
              <dt>到着</dt>
              <dd>{step.meta.arr}</dd>
            </div>
          ) : null}
          {step.meta.note ? (
            <div className="journeys-card__detail">
              <dt>NOTE</dt>
              <dd>{step.meta.note}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </article>
  )
}

const MemoryCard = ({ step, journey }: { step: JourneyEpisodeStep; journey: Journey }) => {
  const photoSrc = step.photo ? resolveAssetPath(step.photo.src) : undefined
  return (
    <article className="journeys-card journeys-card--memory" tabIndex={-1}>
      <p className="journeys-card__eyebrow">MEMORIES</p>
      <h3 className="journeys-card__title">{step.title ?? journey.title}</h3>
      {step.photo && photoSrc ? (
        <figure className="journeys-card__figure">
          <img
            className="journeys-map journeys-map--image"
            src={photoSrc}
            alt={step.photo.alt}
            loading="lazy"
            style={
              step.photo.objectPosition
                ? { objectPosition: step.photo.objectPosition }
                : undefined
            }
          />
        </figure>
      ) : null}
      <div className="journeys-card__text-group">
        {step.text.map((paragraph, index) => (
          <p key={index} className="journeys-card__text">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}

const QuestionCard = ({
  step,
  journey,
  value,
  storedResponse,
  isLocked,
  onAnswerChange,
  onSubmit,
  onBeginNewSession,
}: {
  step: JourneyQuestionStep
  journey: Journey
  value: string
  storedResponse?: SceneComponentProps['responses'][number]
  isLocked: boolean
  onAnswerChange?: (value: string) => void
  onSubmit?: () => void
  onBeginNewSession?: () => void
}) => {
  const [isSubmitEffectActive, setIsSubmitEffectActive] = useState(false)
  const isChoice = step.style === 'choice'
  const recordedLabel = storedResponse?.recordedAt
    ? `記録: ${formatRecordedAt(storedResponse.recordedAt)}`
    : '未記録'
  const answerValue = value || storedResponse?.answer || ''
  const hasAnswer = answerValue.trim().length > 0
  const shouldShowQuizFeedback = Boolean(isChoice && step.correctAnswer && hasAnswer)
  const isCorrectAnswer = shouldShowQuizFeedback
    ? answerValue === step.correctAnswer
    : undefined
  const canBeginNewSession = Boolean(onBeginNewSession) && isLocked

  useEffect(() => {
    if (!isSubmitEffectActive) return
    const timer = window.setTimeout(() => setIsSubmitEffectActive(false), 600)
    return () => window.clearTimeout(timer)
  }, [isSubmitEffectActive])

  const handleSubmitClick = useCallback(() => {
    if (!onSubmit || isLocked) return
    setIsSubmitEffectActive(true)
    onSubmit()
  }, [isLocked, onSubmit])

  return (
    <article
      className={`journeys-card ${isChoice ? 'journeys-card--quiz' : 'journeys-card--free'}`}
      tabIndex={-1}
    >
      <p className="journeys-card__eyebrow">{isChoice ? 'QUIZ' : 'NOTE'}</p>
      <h3 className="journeys-card__title">{step.prompt}</h3>
      {step.helper ? (
        <p className="journeys-card__helper">{step.helper}</p>
      ) : null}
      {isChoice ? (
        <>
          <div className="journeys-card__choices">
            {(step.choices ?? []).map((choice) => {
              const selected = answerValue === choice
              return (
                <button
                  key={choice}
                  type="button"
                  className="journeys-choice"
                  data-selected={selected}
                  onClick={
                    isLocked || !onAnswerChange ? undefined : () => onAnswerChange(choice)
                  }
                  disabled={isLocked}
                >
                  <span className="journeys-choice__label">{choice}</span>
                  <span className="journeys-choice__icon" aria-hidden="true">
                    {selected ? '●' : '○'}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="journeys-card__quiz-footer">
            {shouldShowQuizFeedback && step.correctAnswer ? (
              <div
                className="journeys-card__quiz-feedback"
                role="status"
                aria-live="polite"
              >
                <p
                  className={`journeys-card__result${
                    isCorrectAnswer ? ' journeys-card__result--correct' : ' journeys-card__result--incorrect'
                  }`}
                >
                  {isCorrectAnswer ? '正解！' : '残念…'}
                </p>
                <p className="journeys-card__answer">正解: {step.correctAnswer}</p>
              </div>
            ) : null}
            <div className="journeys-card__footer-meta">
              {canBeginNewSession ? (
                <button
                  type="button"
                  className="journeys-card__reset"
                  onClick={onBeginNewSession}
                >
                  新規入力
                </button>
              ) : null}
              <span className="journeys-card__timestamp">{recordedLabel}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="journeys-card__form">
          <textarea
            id={step.id}
            className="journeys-card__textarea"
            value={value}
            placeholder={step.placeholder ?? 'ここに感じたことをメモ'}
            onChange={
              !isLocked && onAnswerChange
                ? (event) => onAnswerChange(event.currentTarget.value)
                : undefined
            }
            data-submit-effect={isSubmitEffectActive ? 'true' : undefined}
            disabled={isLocked}
            rows={5}
          />
          <div className="journeys-card__form-footer">
            {onSubmit ? (
              <button
                type="button"
                className="journeys-card__submit"
                onClick={handleSubmitClick}
                disabled={isLocked || !onSubmit}
              >
                入力完了
              </button>
            ) : null}
            <div className="journeys-card__footer-meta">
              {canBeginNewSession ? (
                <button
                  type="button"
                  className="journeys-card__reset"
                  onClick={onBeginNewSession}
                >
                  新規入力
                </button>
              ) : null}
              <span className="journeys-card__timestamp">{recordedLabel}</span>
            </div>
          </div>
        </div>
      )}
      <p className="journeys-card__timestamp">{formatJourneyDate(journey.date)}</p>
    </article>
  )
}

// (Unused after split pages; kept here earlier) — removed

export const JourneysScene = ({
  onAdvance,
  journeys,
  responses,
  saveResponse,
  setDistanceTraveled,
  beginJourneySession,
}: SceneComponentProps) => {
  type StoryPage =
    | { kind: 'journey'; journey: Journey }
    | { kind: 'move'; journey: Journey; step: JourneyMoveStep }
    | { kind: 'memory'; journey: Journey; step: JourneyEpisodeStep }
    | { kind: 'free'; journey: Journey; step: JourneyQuestionStep }
    | { kind: 'quiz'; journey: Journey; step: JourneyQuestionStep }

  const pages: StoryPage[] = useMemo(() => {
    const list: StoryPage[] = []
    journeys.forEach((j) => {
      list.push({ kind: 'journey', journey: j })
      j.steps.forEach((s) => {
        if (s.type === 'move') {
          list.push({ kind: 'move', journey: j, step: s })
        } else if (s.type === 'episode') {
          list.push({ kind: 'memory', journey: j, step: s })
        } else if (s.type === 'question') {
          list.push({ kind: s.style === 'choice' ? 'quiz' : 'free', journey: j, step: s })
        }
      })
    })
    return list
  }, [journeys])

  const [pageIndex, setPageIndex] = useHistoryTrackedState('journeys:pageIndex', 0)
  const [slideState, setSlideState] = useState<'idle' | 'leaving' | 'entering'>('idle')
  const [draftAnswer, setDraftAnswer] = useHistoryTrackedState('journeys:draftAnswer', '')
  const stageRef = useRef<HTMLDivElement | null>(null)
  // Focus container for a11y on page change

  const activePage = pages[pageIndex]
  const activeJourney = activePage?.journey

  const getPageDistance = useCallback(
    (page: StoryPage | undefined): number => {
      if (!page) return 0
      if (page.kind === 'move') return page.step.distanceKm
      if (page.kind === 'memory' || page.kind === 'free' || page.kind === 'quiz') {
        return page.step.distanceKm ?? 0
      }
      return 0
    },
    [],
  )

  const traveledDistance = useMemo(() => {
    let sum = 0
    for (let i = 0; i <= pageIndex && i < pages.length; i += 1) {
      sum += getPageDistance(pages[i])
    }
    return sum
  }, [getPageDistance, pages, pageIndex])

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

  const activeQuestion =
    activePage && (activePage.kind === 'free' || activePage.kind === 'quiz')
      ? activePage.step
      : undefined
  const storedResponse = activeQuestion
    ? responseMap.get(activeQuestion.storageKey)
    : undefined
  const isQuestionReadOnly = activeQuestion
    ? Boolean(storedResponse) && activeQuestion.readonlyAfterSave !== false
    : false

  useEffect(() => {
    if (activeQuestion) setDraftAnswer(storedResponse?.answer ?? '', { record: false })
    else setDraftAnswer('', { record: false })
  }, [activeQuestion, setDraftAnswer, storedResponse])

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!activeQuestion || !activeJourney) return
      if (activeQuestion.readonlyAfterSave !== false && storedResponse !== undefined) return
      setDraftAnswer(value, { label: 'Journeys: edit answer' })
      if (activeQuestion.style === 'choice') {
        if (storedResponse?.answer === value) return
        const isCorrect = activeQuestion.correctAnswer
          ? activeQuestion.correctAnswer === value
          : undefined
        saveResponse({
          journeyId: activeJourney.id,
          stepId: activeQuestion.id,
          storageKey: activeQuestion.storageKey,
          prompt: activeQuestion.prompt,
          answer: value,
          questionType: activeQuestion.style,
          correctAnswer: activeQuestion.correctAnswer,
          isCorrect,
        })
        return
      }

      if (activeQuestion.readonlyAfterSave === false) {
        if (storedResponse?.answer === value) return
        saveResponse({
          journeyId: activeJourney.id,
          stepId: activeQuestion.id,
          storageKey: activeQuestion.storageKey,
          prompt: activeQuestion.prompt,
          answer: value,
          questionType: activeQuestion.style,
        })
        return
      }

    },
    [activeJourney, activeQuestion, saveResponse, storedResponse]
  )

  const handleBeginJourneySession = useCallback(() => {
    beginJourneySession()
    setDraftAnswer('', { label: 'Journeys: begin new session', record: false })
  }, [beginJourneySession, setDraftAnswer])

  if (!activeJourney || !activePage) {
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

  const pageCount = pages.length
  const isLastPage = pageIndex >= pageCount - 1
  const scheduleNext = useCallback(() => {
    if (slideState === 'leaving') return
    setSlideState('leaving')
    const previousIndex = pageIndex
    setTimeout(() => {
      if (isLastPage) {
        onAdvance()
        return
      }
      const nextIndex = Math.min(previousIndex + 1, pageCount - 1)
      if (nextIndex === previousIndex) {
        setSlideState('idle')
        return
      }
      setPageIndex(nextIndex, { label: 'Journeys: advance page' })
    }, 200)
  }, [isLastPage, onAdvance, pageCount, pageIndex, setPageIndex, setSlideState, slideState])

  const handleAnswerSubmit = useCallback(() => {
    if (!activeQuestion || !activeJourney) return
    if (activeQuestion.style !== 'text') return
    if (isQuestionReadOnly) {
      scheduleNext()
      return
    }

    const answer = draftAnswer
    if (activeQuestion.readonlyAfterSave === false) {
      if (storedResponse?.answer !== answer) {
        saveResponse({
          journeyId: activeJourney.id,
          stepId: activeQuestion.id,
          storageKey: activeQuestion.storageKey,
          prompt: activeQuestion.prompt,
          answer,
          questionType: activeQuestion.style,
        })
      }
      scheduleNext()
      return
    }

    if (answer.trim().length === 0) {
      scheduleNext()
      return
    }
    if (storedResponse?.answer !== answer) {
      saveResponse({
        journeyId: activeJourney.id,
        stepId: activeQuestion.id,
        storageKey: activeQuestion.storageKey,
        prompt: activeQuestion.prompt,
        answer,
        questionType: activeQuestion.style,
      })
    }
    scheduleNext()
  }, [
    activeJourney,
    activeQuestion,
    draftAnswer,
    isQuestionReadOnly,
    saveResponse,
    scheduleNext,
    storedResponse,
  ])

  const handleStageClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement
    const tag = target.tagName.toLowerCase()
    if (['button', 'a', 'input', 'textarea', 'select', 'label'].includes(tag)) return
    if (!canAdvanceFromActivePage) return
    scheduleNext()
  }

  // Entering animation on page change
  useEffect(() => {
    setSlideState('entering')
    const t = setTimeout(() => setSlideState('idle'), 240)
    return () => clearTimeout(t)
  }, [pageIndex])

  useEffect(() => {
    const scroller = document.querySelector('.scene-journeys .scene-container') as HTMLElement | null
    if (scroller) scroller.scrollTo({ top: 0 })
    const el = stageRef.current
    if (el) el.focus()
  }, [pageIndex])

  const canAdvanceFromActivePage = (() => {
    if (!activePage) return true
    if (activePage.kind === 'quiz') {
      const answer = storedResponse?.answer ?? draftAnswer
      return typeof answer === 'string' && answer.trim().length > 0
    }
    return true
  })()

  return (
    <SceneLayout eyebrow="Journeys">
      <div
        ref={stageRef}
        className="journeys-stage"
        data-can-advance={canAdvanceFromActivePage ? 'true' : 'false'}
        onClick={handleStageClick}
        role="region"
        aria-label="Journeys story"
        tabIndex={0}
      >
        <div className="journeys-slide" data-state={slideState}>
          {activePage.kind === 'journey' ? (
            <TitleCard eyebrow="JOURNEY" title={activePage.journey.title} />
          ) : activePage.kind === 'move' ? (
            <MoveCard step={activePage.step} journey={activePage.journey} />
          ) : activePage.kind === 'memory' ? (
            <MemoryCard step={activePage.step} journey={activePage.journey} />
          ) : activePage.kind === 'free' ? (
            <QuestionCard
              step={activePage.step}
              journey={activePage.journey}
              value={draftAnswer}
              storedResponse={storedResponse}
              isLocked={isQuestionReadOnly}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleAnswerSubmit}
              onBeginNewSession={handleBeginJourneySession}
            />
          ) : (
            <QuestionCard
              step={activePage.step}
              journey={activePage.journey}
              value={draftAnswer}
              storedResponse={storedResponse}
              isLocked={isQuestionReadOnly}
              onAnswerChange={handleAnswerChange}
            />
          )}
        </div>
        <div className="journeys-tap-hint" aria-hidden="true">
          <span className="journeys-tap-hint__dot" />
          画面タップで次へ
        </div>
      </div>
    </SceneLayout>
  )
}
