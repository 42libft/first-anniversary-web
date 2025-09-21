import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
<<<<<<< HEAD
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

=======
} from 'react'

import { SceneLayout } from '../components/SceneLayout'
>>>>>>> origin/main
import type {
  Journey,
  JourneyCoordinate,
  JourneyEpisodeStep,
  JourneyMoveStep,
  JourneyQuestionStep,
} from '../types/journey'
import type { SceneComponentProps } from '../types/scenes'
<<<<<<< HEAD
import type { JourneyPromptResponse } from '../types/experience'
=======
>>>>>>> origin/main

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

const formatDistance = (value: number) => distanceFormatter.format(Math.round(value))

const formatJourneyDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return dateFormatter.format(parsed)
}

const formatRecordedAt = (value?: string) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return timestampFormatter.format(parsed)
}

const transportMeta: Record<JourneyMoveStep['mode'], { label: string; icon: string }> = {
  flight: { label: '飛行機', icon: '✈️' },
  walk: { label: '徒歩', icon: '🚶' },
  bus: { label: 'バス', icon: '🚌' },
  train: { label: '電車', icon: '🚆' },
}

type StoryPage =
  | { kind: 'intro'; key: string; journey: Journey }
  | {
      kind: 'move'
      key: string
      journey: Journey
      step: JourneyMoveStep
      distance: { before: number; after: number }
    }
  | { kind: 'memory'; key: string; journey: Journey; step: JourneyEpisodeStep }
  | {
      kind: 'free'
      key: string
      journey: Journey
      step: JourneyQuestionStep & { style: 'text' }
    }
  | {
      kind: 'quiz'
      key: string
      journey: Journey
      step: JourneyQuestionStep & { style: 'choice' }
    }

type StoryQuestionPage = Extract<StoryPage, { kind: 'free' | 'quiz' }>

const stageKindLabel: Record<StoryPage['kind'], string> = {
  intro: 'タイトル',
  move: '移動',
  memory: '思い出',
  free: '自由記述',
  quiz: 'クイズ',
}

<<<<<<< HEAD
const isAutoAdvancePage = (page: StoryPage) =>
  page.kind === 'intro' || page.kind === 'move' || page.kind === 'memory'

const isTextQuestion = (
  step: JourneyQuestionStep
): step is JourneyQuestionStep & { style: 'text' } => step.style === 'text'

const isChoiceQuestion = (
  step: JourneyQuestionStep
): step is JourneyQuestionStep & { style: 'choice' } => step.style === 'choice'

const buildStoryPages = (journeyList: Journey[]): StoryPage[] => {
  const pages: StoryPage[] = []
  let cumulativeDistance = 0

  journeyList.forEach((journey) => {
    pages.push({ kind: 'intro', key: `${journey.id}-intro`, journey })

    journey.steps.forEach((step) => {
      if (step.type === 'move') {
        const before = cumulativeDistance
        cumulativeDistance += step.distanceKm
        pages.push({
          kind: 'move',
          key: step.id,
          journey,
          step,
          distance: { before, after: cumulativeDistance },
        })
        return
      }

      if (step.type === 'episode') {
        pages.push({ kind: 'memory', key: step.id, journey, step })
        return
      }

      if (step.type === 'question') {
        if (isTextQuestion(step)) {
          pages.push({ kind: 'free', key: step.id, journey, step })
        } else if (isChoiceQuestion(step)) {
          pages.push({ kind: 'quiz', key: step.id, journey, step })
        }
      }
    })
  })

  return pages
}

=======
>>>>>>> origin/main
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

const JourneyIntroCard = ({ journey }: { journey: Journey }) => (
  <article className="journeys-card journeys-card--intro">
    <p className="journeys-card__eyebrow">STORY</p>
    <h2 className="journeys-card__title">{journey.title}</h2>
    <p className="journeys-card__date">{formatJourneyDate(journey.date)}</p>
    <p className="journeys-card__description">
      この旅では合計{formatDistance(journey.distanceKm)}kmを一緒に移動したよ。ページをめくりながら、二人の歩みをもう一度たどってみて。
    </p>
  </article>
)

const JourneyFlightMap = ({ step }: { step: JourneyMoveStep }) => {
  const from = step.fromCoord ?? [18, 72]
  const to = step.toCoord ?? [82, 24]
  const controlX = (from[0] + to[0]) / 2
  const controlY = Math.max(Math.min(from[1], to[1]) - 28, 6)
  const path = `M ${from[0]} ${from[1]} Q ${controlX} ${controlY} ${to[0]} ${to[1]}`

  return (
    <svg
      className="journeys-map journeys-map--flight"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${step.from} から ${step.to} へのフライトルート`}
    >
      <defs>
        <radialGradient id="journey-flight-glow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
          <stop offset="45%" stopColor="rgba(90, 130, 255, 0.35)" />
          <stop offset="100%" stopColor="rgba(8, 16, 36, 0.8)" />
        </radialGradient>
        <linearGradient id="journey-flight-path" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6da9ff" />
          <stop offset="100%" stopColor="#ff66c4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="12" fill="url(#journey-flight-glow)" />
      <path
        d={path}
        stroke="#19305b"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />
      <path
        d={path}
        stroke="url(#journey-flight-path)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={from[0]} cy={from[1]} r={3} fill="#6da9ff" stroke="#c6daff" strokeWidth={1.6} />
      <circle cx={to[0]} cy={to[1]} r={3} fill="#ff66c4" stroke="#ffd1ea" strokeWidth={1.6} />
      <text x={from[0]} y={from[1] + 8} className="journeys-map__label" textAnchor="start">
        {step.from}
      </text>
      <text x={to[0]} y={to[1] - 6} className="journeys-map__label" textAnchor="end">
        {step.to}
      </text>
    </svg>
  )
}

const JourneyRouteIllustration = ({ step }: { step: JourneyMoveStep }) => {
  const points = getRoutePoints(step)
  const [first, ...rest] = points
  const path = rest.reduce(
    (acc, point) => `${acc} L ${point[0]} ${point[1]}`,
    `M ${first[0]} ${first[1]}`
  )

  return (
    <svg
      className="journeys-map journeys-map--route"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${step.from} から ${step.to} へのルート`}
    >
      <defs>
        <linearGradient id="journey-route-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(17, 27, 52, 0.9)" />
          <stop offset="100%" stopColor="rgba(8, 14, 32, 0.95)" />
        </linearGradient>
        <linearGradient id="journey-route-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7fd7ff" />
          <stop offset="100%" stopColor="#ff66c4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="12" fill="url(#journey-route-bg)" />
      <path d={path} stroke="#1a3159" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d={path} stroke="url(#journey-route-line)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx={first[0]} cy={first[1]} r={3.5} fill="#7fd7ff" stroke="#d2f0ff" strokeWidth={1.3} />
      {rest.length ? (
        <circle cx={rest[rest.length - 1][0]} cy={rest[rest.length - 1][1]} r={3.5} fill="#ff66c4" stroke="#ffd4f0" strokeWidth={1.3} />
      ) : null}
    </svg>
  )
}

const JourneyMoveCard = ({ page }: { page: Extract<StoryPage, { kind: 'move' }> }) => {
  const { step, distance } = page
  const transport = transportMeta[step.mode]

  const details: Array<{ label: string; value: string }> = []
  if (step.meta?.flightNo) {
    details.push({ label: '便名', value: step.meta.flightNo })
  }
  if (step.meta?.dep && step.meta?.arr) {
    details.push({ label: '発着', value: `${step.meta.dep} → ${step.meta.arr}` })
  }
  if (step.meta?.note) {
    details.push({ label: 'メモ', value: step.meta.note })
  }

  const renderMap = () => {
    if (step.mode === 'flight') {
      return <JourneyFlightMap step={step} />
    }

    if (step.mapImage) {
      return (
        <img
          src={step.mapImage.src}
          alt={step.mapImage.alt}
          loading="lazy"
          className="journeys-map journeys-map--image"
        />
      )
    }

    return <JourneyRouteIllustration step={step} />
  }

  return (
    <article className="journeys-card journeys-card--move">
      <p className="journeys-card__eyebrow">移動ページ</p>
      <h2 className="journeys-card__title">
        {step.from} <span className="journeys-card__arrow">→</span> {step.to}
      </h2>
      <p className="journeys-card__meta">
        <span className="journeys-card__tag" aria-label={transport.label}>
          <span aria-hidden="true">{transport.icon}</span>
          <span>{transport.label}</span>
        </span>
        <span className="journeys-card__distance">{formatDistance(step.distanceKm)} km</span>
      </p>
      <figure className="journeys-card__figure journeys-card__figure--map">
        {renderMap()}
        {step.description ? (
          <figcaption className="journeys-card__caption">{step.description}</figcaption>
        ) : null}
      </figure>
      <div className="journeys-card__stats">
        <div className="journeys-card__stat">
          <span className="journeys-card__stat-label">累計距離</span>
          <span className="journeys-card__stat-value">{formatDistance(distance.after)} km</span>
        </div>
      </div>
      {details.length ? (
        <dl className="journeys-card__details">
          {details.map((item) => (
            <div className="journeys-card__detail" key={`${page.step.id}-${item.label}`}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  )
}

const JourneyEpisodeCard = ({ step }: { step: JourneyEpisodeStep }) => (
  <article className="journeys-card journeys-card--memory">
    <p className="journeys-card__eyebrow">思い出ページ</p>
    {step.title ? <h2 className="journeys-card__title">{step.title}</h2> : null}
    <figure className="journeys-card__figure journeys-card__figure--photo">
      <img
        src={step.photo.src}
        alt={step.photo.alt}
        loading="lazy"
        style={{ objectPosition: step.photo.objectPosition ?? 'center' }}
      />
    </figure>
    <div className="journeys-card__text-group">
      {step.text.map((paragraph, index) => (
        <p key={`${step.id}-text-${index}`} className="journeys-card__text">
          {paragraph}
        </p>
      ))}
    </div>
  </article>
)

type FreeResponseCardProps = {
  step: JourneyQuestionStep & { style: 'text' }
  existingAnswer?: string
  recordedAt?: string
  onSubmit: (answer: string) => void
}

const JourneyFreeResponseCard = ({
  step,
  existingAnswer,
  recordedAt,
  onSubmit,
}: FreeResponseCardProps) => {
  const [value, setValue] = useState(existingAnswer ?? '')
  const [didSave, setDidSave] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setValue(existingAnswer ?? '')
  }, [existingAnswer])

  useEffect(() => {
    setDidSave(Boolean(existingAnswer))
  }, [existingAnswer])

  const isLocked = Boolean(step.readonlyAfterSave && existingAnswer)

  useEffect(() => {
    if (!isLocked && !existingAnswer) {
      textareaRef.current?.focus({ preventScroll: true })
    }
  }, [existingAnswer, isLocked, step.id])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isLocked) {
      return
    }

    onSubmit(trimmed)
    setDidSave(true)
  }

  return (
    <article className="journeys-card journeys-card--free">
      <p className="journeys-card__eyebrow">自由記述ページ</p>
      <h2 className="journeys-card__title">{step.prompt}</h2>
      {step.helper ? (
        <p className="journeys-card__helper">{step.helper}</p>
      ) : null}
      <form className="journeys-card__form" onSubmit={handleSubmit} data-interactive="true">
        <textarea
          ref={textareaRef}
          className="journeys-card__textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={step.placeholder}
          disabled={isLocked}
        />
        <div className="journeys-card__form-footer">
          {recordedAt ? (
            <span className="journeys-card__timestamp">記録: {formatRecordedAt(recordedAt)}</span>
          ) : null}
          <button
            type="submit"
            className="journeys-card__submit"
            disabled={isLocked || !value.trim()}
          >
            {existingAnswer ? '更新する' : '記録する'}
          </button>
        </div>
      </form>
      {isLocked ? (
        <p className="journeys-card__status">記録済みの回答は変更できません。</p>
      ) : didSave ? (
        <p className="journeys-card__status">保存しました。</p>
      ) : null}
    </article>
  )
}

type JourneyQuizCardProps = {
  step: JourneyQuestionStep & { style: 'choice' }
  existingAnswer?: string
  recordedAt?: string
  onSelect: (answer: string) => void
}

const JourneyQuizCard = ({
  step,
  existingAnswer,
  recordedAt,
  onSelect,
}: JourneyQuizCardProps) => {
  const isLocked = Boolean(step.readonlyAfterSave && existingAnswer)
  const choiceRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (!step.choices?.length || isLocked) {
      return
    }

    const preferred =
      (existingAnswer && choiceRefs.current[existingAnswer]) ||
      (step.choices?.[0] ? choiceRefs.current[step.choices[0]] : null)

    preferred?.focus({ preventScroll: true })
  }, [existingAnswer, isLocked, step.choices, step.id])

  const handleSelect = (choice: string) => {
    if (isLocked) {
      return
    }

    onSelect(choice)
  }

  return (
    <article className="journeys-card journeys-card--quiz">
      <p className="journeys-card__eyebrow">クイズページ</p>
      <h2 className="journeys-card__title">{step.prompt}</h2>
      <div className="journeys-card__choices" data-interactive="true">
        {step.choices?.map((choice) => {
          const isSelected = existingAnswer === choice
          return (
            <button
              key={choice}
              type="button"
              className="journeys-choice"
              data-selected={isSelected ? 'true' : 'false'}
              onClick={() => handleSelect(choice)}
              disabled={isLocked}
              ref={(element) => {
                choiceRefs.current[choice] = element
              }}
            >
              <span className="journeys-choice__label">{choice}</span>
              <span className="journeys-choice__icon" aria-hidden="true">
                {isSelected ? '★' : '›'}
              </span>
            </button>
          )
        })}
      </div>
      <div className="journeys-card__status-row">
        {recordedAt ? (
          <span className="journeys-card__timestamp">記録: {formatRecordedAt(recordedAt)}</span>
        ) : null}
        {isLocked ? (
          <span className="journeys-card__status">回答済み</span>
        ) : existingAnswer ? (
          <span className="journeys-card__status">保存しました</span>
        ) : null}
      </div>
    </article>
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
<<<<<<< HEAD
  const pages = useMemo(() => buildStoryPages(journeys), [journeys])
  const [pageIndex, setPageIndex] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const stageHintId = useId()

  const currentPage = pages[pageIndex]

  const responseMap = useMemo(() => {
    const map = new Map<string, JourneyPromptResponse>()
    responses.forEach((entry) => {
      map.set(entry.storageKey, entry)
    })
    return map
  }, [responses])

  useEffect(() => {
    setDistanceTraveled(0)
  }, [setDistanceTraveled])
=======
  const stepEntries = useMemo(() => buildStepEntries(journeys), [journeys])

  const [activeJourneyIndex, setActiveJourneyIndex] = useState(0)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')
>>>>>>> origin/main

  useEffect(() => {
    if (!currentPage || currentPage.kind !== 'move') {
      return
    }

<<<<<<< HEAD
    setDistanceTraveled((prev) =>
      Math.max(prev, currentPage.distance.after)
=======
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
>>>>>>> origin/main
    )
  }, [currentPage, setDistanceTraveled])

  const handleSaveResponse = useCallback(
    (page: StoryQuestionPage, answer: string) => {
      saveResponse({
        journeyId: page.journey.id,
        stepId: page.step.id,
        storageKey: page.step.storageKey,
        prompt: page.step.prompt,
        answer,
      })
    },
    [saveResponse]
  )

  const handleNext = useCallback(() => {
    setPageIndex((index) => {
      if (index >= pages.length - 1) {
        onAdvance()
        return index
      }

      return Math.min(index + 1, pages.length - 1)
    })
  }, [onAdvance, pages.length])

  const handlePrev = useCallback(() => {
    setPageIndex((index) => Math.max(index - 1, 0))
  }, [])

  useEffect(() => {
    const stageEl = stageRef.current
    if (!stageEl) {
      return
    }

    stageEl.scrollTop = 0
    if (currentPage && isAutoAdvancePage(currentPage)) {
      stageEl.focus({ preventScroll: true })
    }
  }, [currentPage, pageIndex])

  const handleStageKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) {
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        handlePrev()
        return
      }

      if (
        currentPage &&
        isAutoAdvancePage(currentPage) &&
        (event.key === 'Enter' ||
          event.key === ' ' ||
          event.key === 'Spacebar' ||
          event.key === 'ArrowRight' ||
          event.key === 'PageDown')
      ) {
        event.preventDefault()
        handleNext()
      }
    },
    [currentPage, handleNext, handlePrev]
  )

  const handleStageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }

      if (target.closest('button, a, input, textarea, select, label')) {
        return
      }

      handleNext()
    },
    [handleNext]
  )

  if (!currentPage) {
    return null
  }

<<<<<<< HEAD
  const progress = pages.length ? ((pageIndex + 1) / pages.length) * 100 : 0
  const isLastPage = pageIndex >= pages.length - 1
  const stageClickable = isAutoAdvancePage(currentPage)

  const renderPage = (page: StoryPage) => {
    switch (page.kind) {
      case 'intro':
        return <JourneyIntroCard journey={page.journey} />
      case 'move':
        return <JourneyMoveCard page={page} />
      case 'memory':
        return <JourneyEpisodeCard step={page.step} />
      case 'free': {
        const stored = responseMap.get(page.step.storageKey)
        return (
          <JourneyFreeResponseCard
            step={page.step}
            existingAnswer={stored?.answer}
            recordedAt={stored?.recordedAt}
            onSubmit={(answer) => handleSaveResponse(page, answer)}
          />
        )
      }
      case 'quiz': {
        const stored = responseMap.get(page.step.storageKey)
        return (
          <JourneyQuizCard
            step={page.step}
            existingAnswer={stored?.answer}
            recordedAt={stored?.recordedAt}
            onSelect={(answer) => handleSaveResponse(page, answer)}
          />
        )
      }
      default:
        return null
    }
  }

  return (
    <section className="journeys-experience" aria-label="二人の旅の紙芝居">
      <header className="journeys-story-header">
        <div className="journeys-story-header__top">
          <span className="journeys-story-header__label">{stageKindLabel[currentPage.kind]}</span>
          <span className="journeys-story-header__count">{pageIndex + 1} / {pages.length}</span>
        </div>
        <h1 className="journeys-story-header__title">{currentPage.journey.title}</h1>
        <p className="journeys-story-header__date">{formatJourneyDate(currentPage.journey.date)}</p>
        <div className="journeys-story-progress" aria-hidden="true">
          <div className="journeys-story-progress__track">
            <div
              className="journeys-story-progress__fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>
      <div className="journeys-stage-wrapper">
        <div
          className="journeys-stage"
          data-kind={currentPage.kind}
          data-can-advance={stageClickable ? 'true' : 'false'}
          ref={stageRef}
          onClick={stageClickable ? handleStageClick : undefined}
          onKeyDown={handleStageKeyDown}
          role={stageClickable ? 'button' : undefined}
          tabIndex={0}
          aria-describedby={!isLastPage && stageClickable ? stageHintId : undefined}
        >
          {renderPage(currentPage)}
        </div>
=======
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
>>>>>>> origin/main
      </div>
      <div className="journeys-controls" data-interactive="true">
        <button
          type="button"
          className="journeys-controls__button"
          onClick={handlePrev}
          disabled={pageIndex === 0}
        >
          戻る
        </button>
        <button
          type="button"
          className="journeys-controls__button journeys-controls__button--primary"
          onClick={handleNext}
        >
          {isLastPage ? '次のシーンへ' : '次のページ'}
        </button>
      </div>
      {!isLastPage && stageClickable ? (
        <p className="journeys-tap-hint" id={stageHintId} role="note">
          <span className="journeys-tap-hint__dot" />
          タップで次へ進む
        </p>
      ) : null}
    </section>
  )
}
