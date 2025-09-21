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
        {step.mapImage ? (
          <img
            className="journeys-map journeys-map--image"
            src={step.mapImage.src}
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
  return (
    <article className="journeys-card journeys-card--memory" tabIndex={-1}>
      <p className="journeys-card__eyebrow">MEMORIES</p>
      <h3 className="journeys-card__title">{step.title ?? journey.title}</h3>
      <figure className="journeys-card__figure">
        <img
          className="journeys-map journeys-map--image"
          src={step.photo.src}
          alt={step.photo.alt}
          loading="lazy"
          style={
            step.photo.objectPosition
              ? { objectPosition: step.photo.objectPosition }
              : undefined
          }
        />
      </figure>
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
  onTextBlur,
}: {
  step: JourneyQuestionStep
  journey: Journey
  value: string
  storedResponse?: SceneComponentProps['responses'][number]
  isLocked: boolean
  onAnswerChange?: (value: string) => void
  onTextBlur?: () => void
}) => {
  const isChoice = step.style === 'choice'
  const recordedLabel = storedResponse?.recordedAt
    ? `記録: ${formatRecordedAt(storedResponse.recordedAt)}`
    : '未記録'

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
        <div className="journeys-card__choices">
          {(step.choices ?? []).map((choice) => {
            const selected = value === choice
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
            onBlur={onTextBlur}
            disabled={isLocked}
            rows={5}
          />
          <div className="journeys-card__form-footer">
            <span className="journeys-card__timestamp">{recordedLabel}</span>
          </div>
        </div>
      )}
      <p className="journeys-card__status">
        {isLocked ? '保存済みのため編集できません。' : '回答は自動保存されます。'}
      </p>
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
}: SceneComponentProps) => {
  type StoryPage =
    | { kind: 'journeyTitle'; journey: Journey }
    | { kind: 'moveTitle'; journey: Journey; step: JourneyMoveStep }
    | { kind: 'move'; journey: Journey; step: JourneyMoveStep }
    | { kind: 'memoryTitle'; journey: Journey; step: JourneyEpisodeStep }
    | { kind: 'memory'; journey: Journey; step: JourneyEpisodeStep }
    | { kind: 'freeTitle'; journey: Journey; step: JourneyQuestionStep }
    | { kind: 'free'; journey: Journey; step: JourneyQuestionStep }
    | { kind: 'quizTitle'; journey: Journey; step: JourneyQuestionStep }
    | { kind: 'quiz'; journey: Journey; step: JourneyQuestionStep }

  const pages: StoryPage[] = useMemo(() => {
    const list: StoryPage[] = []
    journeys.forEach((j) => {
      list.push({ kind: 'journeyTitle', journey: j })
      j.steps.forEach((s) => {
        if (s.type === 'move') {
          list.push({ kind: 'moveTitle', journey: j, step: s })
          list.push({ kind: 'move', journey: j, step: s })
        } else if (s.type === 'episode') {
          list.push({ kind: 'memoryTitle', journey: j, step: s })
          list.push({ kind: 'memory', journey: j, step: s })
        } else if (s.type === 'question') {
          if (s.style === 'choice') {
            list.push({ kind: 'quizTitle', journey: j, step: s })
            list.push({ kind: 'quiz', journey: j, step: s })
          } else {
            list.push({ kind: 'freeTitle', journey: j, step: s })
            list.push({ kind: 'free', journey: j, step: s })
          }
        }
      })
    })
    return list
  }, [journeys])

  const [pageIndex, setPageIndex] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')
  const stageRef = useRef<HTMLDivElement | null>(null)
  // Focus container for a11y on page change

  const activePage = pages[pageIndex]
  const activeJourney = activePage?.journey

  const traveledDistance = useMemo(() => {
    let sum = 0
    for (let i = 0; i <= pageIndex && i < pages.length; i += 1) {
      const p = pages[i]
      if (p.kind === 'move') sum += p.step.distanceKm
    }
    return sum
  }, [pages, pageIndex])

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
    if (activeQuestion) setDraftAnswer(storedResponse?.answer ?? '')
    else setDraftAnswer('')
  }, [activeQuestion, storedResponse])

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!activeQuestion || !activeJourney) return
      if (activeQuestion.readonlyAfterSave !== false && storedResponse !== undefined) return
      setDraftAnswer(value)
      if (activeQuestion.style === 'choice' || activeQuestion.readonlyAfterSave === false) {
        if (storedResponse?.answer === value) return
        saveResponse({
          journeyId: activeJourney.id,
          stepId: activeQuestion.id,
          storageKey: activeQuestion.storageKey,
          prompt: activeQuestion.prompt,
          answer: value,
        })
      }
    },
    [activeJourney, activeQuestion, saveResponse, storedResponse]
  )

  const handleTextBlur = useCallback(() => {
    if (!activeQuestion || !activeJourney) return
    if (activeQuestion.style !== 'text') return
    if (activeQuestion.readonlyAfterSave === false) return
    if (storedResponse !== undefined) return
    if (draftAnswer.trim().length === 0) return
    saveResponse({
      journeyId: activeJourney.id,
      stepId: activeQuestion.id,
      storageKey: activeQuestion.storageKey,
      prompt: activeQuestion.prompt,
      answer: draftAnswer,
    })
  }, [activeJourney, activeQuestion, draftAnswer, saveResponse, storedResponse])

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
  const activePageNumber = pageIndex + 1

  const headerSubtitle = (() => {
    switch (activePage.kind) {
      case 'journeyTitle':
        return activeJourney.title
      case 'moveTitle':
      case 'move':
        return `${activePage.step.from} → ${activePage.step.to}`
      case 'memoryTitle':
      case 'memory':
        return activePage.step.title ?? activeJourney.title
      case 'freeTitle':
      case 'free':
      case 'quizTitle':
      case 'quiz':
        return activePage.step.prompt
      default:
        return ''
    }
  })()

  const isLastPage = pageIndex >= pageCount - 1
  const prevDisabled = pageIndex === 0
  const goPrev = () => setPageIndex((i) => Math.max(i - 1, 0))
  const goNext = () => {
    if (isLastPage) onAdvance()
    else setPageIndex((i) => Math.min(i + 1, pageCount - 1))
  }

  const handleStageClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement
    const tag = target.tagName.toLowerCase()
    if (['button', 'a', 'input', 'textarea', 'select', 'label'].includes(tag)) return
    goNext()
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const tag = target?.tagName?.toLowerCase()
      const inForm = tag === 'textarea' || tag === 'input' || tag === 'select'
      if (inForm) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext])

  useEffect(() => {
    const scroller = document.querySelector('.scene-journeys .scene-container') as HTMLElement | null
    if (scroller) scroller.scrollTo({ top: 0 })
    const el = stageRef.current
    if (el) el.focus()
  }, [pageIndex])

  return (
    <SceneLayout eyebrow="Journeys" title={`${activePageNumber} / ${pageCount}`} description={headerSubtitle}>
      <div
        ref={stageRef}
        className="journeys-stage"
        data-can-advance={!prevDisabled}
        onClick={handleStageClick}
        role="region"
        aria-label="Journeys story"
        tabIndex={0}
      >
        {activePage.kind === 'journeyTitle' ? (
          <TitleCard eyebrow="JOURNEY" title={activePage.journey.title} />
        ) : activePage.kind === 'moveTitle' ? (
          <TitleCard eyebrow="MOVE" title={`${activePage.step.from} → ${activePage.step.to}`} />
        ) : activePage.kind === 'move' ? (
          <MoveCard step={activePage.step} journey={activePage.journey} />
        ) : activePage.kind === 'memoryTitle' ? (
          <TitleCard eyebrow="MEMORIES" title={activePage.step.title ?? activePage.journey.title} />
        ) : activePage.kind === 'memory' ? (
          <MemoryCard step={activePage.step} journey={activePage.journey} />
        ) : activePage.kind === 'freeTitle' ? (
          <TitleCard eyebrow="NOTE" title={activePage.step.prompt} />
        ) : (
          activePage.kind === 'free' ? (
            <QuestionCard
              step={activePage.step}
              journey={activePage.journey}
              value={draftAnswer}
              storedResponse={storedResponse}
              isLocked={isQuestionReadOnly}
              onAnswerChange={handleAnswerChange}
              onTextBlur={handleTextBlur}
            />
          ) : activePage.kind === 'quizTitle' ? (
            <TitleCard eyebrow="QUIZ" title={activePage.step.prompt} />
          ) : (
            <QuestionCard
              step={activePage.step}
              journey={activePage.journey}
              value={draftAnswer}
              storedResponse={storedResponse}
              isLocked={isQuestionReadOnly}
              onAnswerChange={handleAnswerChange}
              onTextBlur={handleTextBlur}
            />
          )
        )}
        <div className="journeys-controls" aria-hidden="true">
          <button type="button" className="journeys-controls__button" onClick={goPrev} disabled={prevDisabled}>
            ← 戻る
          </button>
          <button
            type="button"
            className="journeys-controls__button journeys-controls__button--primary"
            onClick={goNext}
          >
            {isLastPage ? 'Messagesへ' : '次へ'}
          </button>
        </div>
        <div className="journeys-tap-hint" aria-hidden="true">
          <span className="journeys-tap-hint__dot" />
          タップ / Enter / Space で次へ
        </div>
      </div>
    </SceneLayout>
  )
}
