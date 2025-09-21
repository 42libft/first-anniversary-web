import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type {
  Journey,
  JourneyCoordinate,
  JourneyEpisodeStep,
  JourneyMoveStep,
  JourneyQuestionStep,
} from '../types/journey'
import type { SceneComponentProps } from '../types/scenes'
import type { JourneyPromptResponse } from '../types/experience'

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

export const JourneysScene = ({
  onAdvance,
  journeys,
  responses,
  saveResponse,
  setDistanceTraveled,
}: SceneComponentProps) => {
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

  useEffect(() => {
    if (!currentPage || currentPage.kind !== 'move') {
      return
    }

    setDistanceTraveled((prev) =>
      Math.max(prev, currentPage.distance.after)
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
