import { useEffect, useMemo, useRef, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import { totalLikes } from '../data/likes'
import { totalMessages } from '../data/messages'
import {
  journeyQuizAnswerSpecs,
  photoCaptureEstimate,
  resultLegends,
  type ResultStatKey,
} from '../data/result'
import type { SceneComponentProps } from '../types/scenes'

const STAT_ORDER: ResultStatKey[] = [
  'distance',
  'messages',
  'likes',
  'quiz',
  'photos',
]

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(value)

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export const ResultScene = ({
  onRestart,
  journeys,
  distanceTraveled,
  responses,
}: SceneComponentProps) => {
  const totalJourneyDistance = useMemo(() => {
    return Math.round(
      journeys.reduce((sum, journey) => sum + journey.distanceKm, 0)
    )
  }, [journeys])

  const distanceValue = useMemo(() => {
    const rounded = Math.round(distanceTraveled)
    if (rounded > 0) return rounded
    return totalJourneyDistance
  }, [distanceTraveled, totalJourneyDistance])

  const quizStats = useMemo(() => {
    if (journeyQuizAnswerSpecs.length === 0) {
      return { correct: 0, total: 0, ratio: 0 }
    }

    const answerMap = new Map(
      responses.map((response) => [response.storageKey, response.answer.trim()])
    )

    const correct = journeyQuizAnswerSpecs.reduce((count, quiz) => {
      const recorded = answerMap.get(quiz.storageKey)
      if (!recorded) return count
      return recorded === quiz.correctAnswer ? count + 1 : count
    }, 0)

    const ratio = journeyQuizAnswerSpecs.length
      ? clamp((correct / journeyQuizAnswerSpecs.length) * 100, 0, 100)
      : 0

    return {
      correct,
      total: journeyQuizAnswerSpecs.length,
      ratio,
    }
  }, [responses])

  const statMap = useMemo(() => {
    return {
      distance: {
        label: '合計移動距離',
        value: `${formatNumber(distanceValue)} km`,
        meta: `${formatNumber(journeys.length)} 本の旅を完走`,
      },
      messages: {
        label: '送ったメッセージ数',
        value: formatNumber(totalMessages),
        meta: 'Messages シーン計測',
      },
      likes: {
        label: '好きって言った回数',
        value: formatNumber(totalLikes),
        meta: 'Likes シーン計測',
      },
      quiz: {
        label: 'クイズ正解数',
        value:
          quizStats.total > 0
            ? `${formatNumber(quizStats.correct)} / ${formatNumber(quizStats.total)}`
            : '未挑戦',
        meta:
          quizStats.total > 0
            ? `正解率 ${Math.round(quizStats.ratio)}%`
            : 'Journey Quiz を進めよう',
      },
      photos: {
        label: '撮った写真枚数',
        value: formatNumber(photoCaptureEstimate),
        meta: '※仮のカウント（後で差し替え）',
      },
    } satisfies Record<ResultStatKey, { label: string; value: string; meta: string }>
  }, [distanceValue, journeys.length, quizStats, totalLikes, totalMessages])

  const legendsViewportRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const [activeLegendIndex, setActiveLegendIndex] = useState(0)

  useEffect(() => {
    const viewport = legendsViewportRef.current
    if (!viewport) return

    let frame = 0
    const handleScroll = () => {
      const cards = cardRefs.current
      if (!cards.length) return
      const center = viewport.scrollLeft + viewport.clientWidth / 2
      let closestIndex = 0
      let minDistance = Number.POSITIVE_INFINITY
      cards.forEach((card, index) => {
        if (!card) return
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(cardCenter - center)
        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      })
      setActiveLegendIndex((prev) => (prev === closestIndex ? prev : closestIndex))
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(handleScroll)
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    handleScroll()

    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('scroll', onScroll)
    }
  }, [])

  const scrollToLegend = (index: number) => {
    const viewport = legendsViewportRef.current
    const card = cardRefs.current[index]
    if (!viewport || !card) return
    viewport.scrollTo({
      left: card.offsetLeft,
      behavior: 'smooth',
    })
    setActiveLegendIndex(index)
  }

  const handlePrev = () => {
    const nextIndex = Math.max(0, activeLegendIndex - 1)
    scrollToLegend(nextIndex)
  }

  const handleNext = () => {
    const nextIndex = Math.min(resultLegends.length - 1, activeLegendIndex + 1)
    scrollToLegend(nextIndex)
  }

  return (
    <SceneLayout hideHeader onAdvance={onRestart} advanceLabel="もう一度再生">
      <div className="result-stage" role="presentation">
        <header className="result-stage__nav">
          <nav className="result-stage__tabs" aria-label="リザルトタブ">
            <span className="result-stage__tab">観戦</span>
            <span className="result-stage__tab">戦闘データ</span>
            <span className="result-stage__tab is-active">リザルト</span>
          </nav>
          <div className="result-stage__shoulder" aria-hidden="true">
            <span className="result-stage__shoulder-key">L1</span>
            <span className="result-stage__shoulder-divider" />
            <span className="result-stage__shoulder-key">R1</span>
          </div>
        </header>

        <div className="result-banner" role="presentation">
          <div className="result-banner__stripe" aria-hidden="true" />
          <div className="result-banner__content">
            <span className="result-banner__subtitle">アリーナ</span>
            <span className="result-banner__title">チャンピオン</span>
          </div>
          <div className="result-banner__meta" role="group" aria-label="部隊ステータス">
            <span className="result-banner__meta-item">
              部隊の順位 <strong>1位</strong>
            </span>
            <span className="result-banner__meta-divider" aria-hidden="true" />
            <span className="result-banner__meta-item">
              部隊の合計キル <strong>5</strong>
            </span>
          </div>
        </div>

        <section className="result-cards" aria-label="レジェンドリザルト">
          <div className="result-cards__viewport" ref={legendsViewportRef}>
            {resultLegends.map((legend, index) => (
              <article
                key={legend.id}
                ref={(element) => {
                  cardRefs.current[index] = element
                }}
                className={`result-card${index === activeLegendIndex ? ' is-active' : ''}`}
                aria-label={`${legend.displayName} — ${legend.headline}`}
              >
                <div className="result-card__inner">
                  <header className="result-card__header">
                    <p className="result-card__codename">{legend.codename}</p>
                    <h2 className="result-card__name">{legend.displayName}</h2>
                    <p className="result-card__role">{legend.role}</p>
                    {legend.emblem ? (
                      <p className="result-card__emblem">{legend.emblem}</p>
                    ) : null}
                  </header>
                  <figure className="result-card__portrait-frame">
                    <img
                      src={legend.portrait.src}
                      alt={legend.portrait.alt}
                      loading="lazy"
                      className="result-card__portrait"
                    />
                  </figure>
                  <ul className="result-card__stats">
                    {STAT_ORDER.map((statKey) => {
                      const stat = statMap[statKey]
                      return (
                        <li
                          key={statKey}
                          className={`result-card__stat${
                            legend.statFocus === statKey ? ' is-highlight' : ''
                          }`}
                        >
                          <span className="result-card__stat-label">{stat.label}</span>
                          <span className="result-card__stat-value">{stat.value}</span>
                          <span className="result-card__stat-meta">{stat.meta}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <footer className="result-card__footer">
                    <p className="result-card__headline">{legend.headline}</p>
                    <p className="result-card__description">{legend.description}</p>
                  </footer>
                </div>
              </article>
            ))}
          </div>

          <div className="result-cards__controls" aria-hidden="true">
            <button
              type="button"
              className="result-cards__control"
              onClick={handlePrev}
              disabled={activeLegendIndex === 0}
            >
              ←
            </button>
            <div className="result-cards__dots">
              {resultLegends.map((legend, index) => (
                <button
                  key={legend.id}
                  type="button"
                  className={`result-cards__dot${
                    index === activeLegendIndex ? ' is-active' : ''
                  }`}
                  onClick={() => scrollToLegend(index)}
                  aria-label={`${legend.displayName} を表示`}
                />
              ))}
            </div>
            <button
              type="button"
              className="result-cards__control"
              onClick={handleNext}
              disabled={activeLegendIndex === resultLegends.length - 1}
            >
              →
            </button>
          </div>
        </section>

        <footer className="result-stage__footer" aria-hidden="true">
          <span className="result-stage__footer-icon">●</span>
          <span className="result-stage__footer-text">ロビーに戻る</span>
        </footer>
      </div>
    </SceneLayout>
  )
}
