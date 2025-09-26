import { useMemo } from 'react'

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

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(value)

interface StatRow {
  key: ResultStatKey
  label: string
  value: string
}

export const ResultScene = ({
  onRestart,
  journeys,
  distanceTraveled,
  responses,
}: SceneComponentProps) => {
  const totalJourneyDistance = useMemo(
    () => Math.round(journeys.reduce((sum, journey) => sum + journey.distanceKm, 0)),
    [journeys]
  )

  const distanceValue = useMemo(() => {
    const rounded = Math.round(distanceTraveled)
    return rounded > 0 ? rounded : totalJourneyDistance
  }, [distanceTraveled, totalJourneyDistance])

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

  const statRows = useMemo<StatRow[]>(
    () => [
      {
        key: 'quiz',
        label: 'クイズ正解数',
        value:
          quizStats.total > 0
            ? `${formatNumber(quizStats.correct)} / ${formatNumber(quizStats.total)}`
            : '0',
      },
      {
        key: 'messages',
        label: '送ったメッセージ数',
        value: formatNumber(totalMessages),
      },
      {
        key: 'distance',
        label: '合計移動距離',
        value: `${formatNumber(distanceValue)} km`,
      },
      {
        key: 'likes',
        label: '好きって言った回数',
        value: formatNumber(totalLikes),
      },
      {
        key: 'photos',
        label: '撮った写真枚数',
        value: formatNumber(photoCaptureEstimate),
      },
    ],
    [distanceValue, photoCaptureEstimate, quizStats, totalLikes, totalMessages]
  )

  const cardData = useMemo(
    () =>
      resultLegends.map((legend) => ({
        legend,
        stats: statRows.map((row) => ({
          ...row,
          emphasize: row.key === legend.statFocus,
        })),
      })),
    [statRows]
  )

  return (
    <SceneLayout hideHeader onAdvance={onRestart} advanceLabel="もう一度再生">
      <div className="apex-result" role="presentation">
        <div className="apex-result__topbackdrop" aria-hidden="true" />

        <header className="apex-result__header">
          <div className="apex-result__camera" aria-hidden="true">
            <span className="apex-result__camera-icon" />
          </div>
          <nav className="apex-result__tabs" aria-label="リザルトタブ">
            <span className="apex-result__tab">観戦</span>
            <span className="apex-result__tab">戦闘データ</span>
            <span className="apex-result__tab is-active">リザルト</span>
          </nav>
          <div className="apex-result__shoulders" aria-hidden="true">
            <span className="apex-result__shoulder">L1</span>
            <span className="apex-result__shoulder-divider" />
            <span className="apex-result__shoulder">R1</span>
          </div>
        </header>

        <div className="apex-result__banner" role="group" aria-label="部隊ステータス">
          <div className="apex-result__banner-bg" aria-hidden="true" />
          <p className="apex-result__banner-title">アリーナチャンピオン</p>
          <div className="apex-result__banner-meta">
            <span>
              部隊の順位 <strong>1位</strong>
            </span>
            <span className="apex-result__banner-divider" aria-hidden="true" />
            <span>
              部隊の合計キル <strong>17</strong>
            </span>
          </div>
        </div>

        <section className="apex-result__cards" aria-label="レジェンドのリザルト">
          {cardData.map(({ legend, stats }) => (
            <article key={legend.id} className="apex-card" aria-label={legend.displayName}>
              <div className="apex-card__frame">
                <header className="apex-card__header">
                  <p className="apex-card__name">{legend.displayName}</p>
                </header>
                <dl className="apex-card__stats">
                  {stats.map((stat) => (
                    <div key={stat.key} className="apex-card__stat">
                      <dt className="apex-card__label">{stat.label}</dt>
                      <dd
                        className={`apex-card__value${
                          stat.emphasize ? ' is-highlight' : ''
                        }`}
                      >
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <footer className="apex-card__footer" aria-hidden="true">
                  <span className="apex-card__footer-icon" />
                </footer>
              </div>
              <figure className="apex-card__portrait" aria-hidden="true">
                <img src={legend.portrait.src} alt="" loading="lazy" />
              </figure>
            </article>
          ))}
        </section>

        <footer className="apex-result__footer" aria-hidden="true">
          <span className="apex-result__footer-button">◯</span>
          <span className="apex-result__footer-text">ロビーに戻る</span>
        </footer>
      </div>
    </SceneLayout>
  )
}
