import { useEffect, useMemo, useRef, useState } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import { totalLikes } from '../data/likes'
import { totalMessages } from '../data/messages'
import {
  journeyQuizAnswerSpecs,
  photoCaptureEstimate,
  resultLegends,
} from '../data/result'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(value)

export const ResultScene = ({
  onRestart,
  journeys,
  distanceTraveled,
  responses,
}: SceneComponentProps) => {
  const quizStats = useMemo(() => {
    if (journeyQuizAnswerSpecs.length === 0) {
      return { correct: 0, total: 0 }
    }

    const answerMap = new Map(
      responses.map((response) => [response.storageKey, response.answer.trim()])
    )

    const correct = journeyQuizAnswerSpecs.reduce((count, quiz) => {
      const recorded = answerMap.get(quiz.storageKey)
      if (!recorded) return count
      return recorded === quiz.correctAnswer ? count + 1 : count
    }, 0)

    return {
      correct,
      total: journeyQuizAnswerSpecs.length,
    }
  }, [responses])

  const summaryItems = useMemo(
    () => [
      {
        key: 'distance',
        label: '合計移動距離',
        value: `${formatNumber(Math.round(distanceTraveled))} km`,
        detail: `${formatNumber(journeys.length)}本の旅ログ`,
      },
      {
        key: 'quiz',
        label: 'クイズ正解数',
        value:
          quizStats.total > 0
            ? `${formatNumber(quizStats.correct)} / ${formatNumber(quizStats.total)}`
            : formatNumber(quizStats.correct),
        detail: quizStats.total > 0 ? 'Journey Quiz' : '未回答',
      },
      {
        key: 'messages',
        label: '送ったメッセージ数',
        value: formatNumber(totalMessages),
        detail: 'Messages Scene',
      },
      {
        key: 'likes',
        label: '好きって言った回数',
        value: formatNumber(totalLikes),
        detail: 'Likes Scene',
      },
      {
        key: 'photos',
        label: '撮った写真枚数',
        value: formatNumber(photoCaptureEstimate),
        detail: '※仮のカウント',
      },
    ],
    [distanceTraveled, journeys.length, quizStats]
  )

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
        <header className="result-stage__header">
          <nav className="result-stage__tabs" aria-label="リザルトタブ">
            <span className="result-stage__tab">観戦</span>
            <span className="result-stage__tab">戦闘データ</span>
            <span className="result-stage__tab is-active">リザルト</span>
          </nav>
          <div className="result-stage__headline">
            <span className="result-stage__title">チャンピオン</span>
            <div className="result-stage__meta">
              <span className="result-stage__meta-item">
                部隊の順位 <strong>1位</strong>
              </span>
              <span className="result-stage__meta-separator" aria-hidden />
              <span className="result-stage__meta-item">
                部隊の合計キル <strong>3</strong>
              </span>
            </div>
          </div>
        </header>

        <div className="result-stage__board">
          <section className="result-summary" aria-labelledby="result-summary-heading">
            <div className="result-summary__header">
              <h2 id="result-summary-heading" className="result-section-title">
                チーム総計
              </h2>
              <p className="result-summary__hint">一年の歩みをここに集約。</p>
            </div>
            <ul className="result-summary__list">
              {summaryItems.map((item) => (
                <li key={item.key} className="result-summary__item">
                  <p className="result-summary__label">{item.label}</p>
                  <p className="result-summary__value">{item.value}</p>
                  <p className="result-summary__detail">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="result-legends" aria-labelledby="result-legends-heading">
            <div className="result-legends__header">
              <h2 id="result-legends-heading" className="result-section-title">
                レジェンドレポート
              </h2>
              <p className="result-legends__hint">縦画面では左右にスワイプ。</p>
            </div>
            <div
              ref={legendsViewportRef}
              className="result-legends__viewport"
              role="group"
              aria-roledescription="スライダー"
              aria-label="ふたりの活躍"
            >
              {resultLegends.map((legend, index) => (
                <article
                  key={legend.id}
                  ref={(element) => {
                    cardRefs.current[index] = element
                  }}
                  className={`result-legend-card${
                    index === activeLegendIndex ? ' is-active' : ''
                  }`}
                  aria-label={`${legend.displayName} — ${legend.headline}`}
                >
                  <div className="result-legend-card__frame">
                    <img
                      src={legend.portrait.src}
                      alt={legend.portrait.alt}
                      className="result-legend-card__portrait"
                      loading="lazy"
                    />
                  </div>
                  <div className="result-legend-card__body">
                    <p className="result-legend-card__codename">{legend.codename}</p>
                    <h3 className="result-legend-card__name">{legend.displayName}</h3>
                    <p className="result-legend-card__role">{legend.role}</p>
                    <p className="result-legend-card__headline">{legend.headline}</p>
                    <p className="result-legend-card__description">{legend.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="result-legends__controls" aria-hidden="true">
              <button
                type="button"
                className="result-legends__control"
                onClick={handlePrev}
                disabled={activeLegendIndex === 0}
              >
                ←
              </button>
              <div className="result-legends__dots">
                {resultLegends.map((legend, index) => (
                  <button
                    key={legend.id}
                    type="button"
                    className={`result-legends__dot${
                      index === activeLegendIndex ? ' is-active' : ''
                    }`}
                    onClick={() => scrollToLegend(index)}
                    aria-label={`${legend.displayName} を表示`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="result-legends__control"
                onClick={handleNext}
                disabled={activeLegendIndex === resultLegends.length - 1}
              >
                →
              </button>
            </div>
          </section>
        </div>

        <footer className="result-stage__footer" aria-hidden="true">
          <span className="result-stage__footer-key">SPACE</span>
          <span className="result-stage__footer-text">ロビーに戻る</span>
        </footer>
      </div>
    </SceneLayout>
  )
}
