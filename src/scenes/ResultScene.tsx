import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, TouchEvent } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'

import './ResultScene.css'

type PlayerRole = 'you' | 'ally'

type StatKey =
  | 'quizCorrect'
  | 'messages'
  | 'distanceKm'
  | 'saidLove'
  | 'photos'

interface ResultPayloadPlayer {
  role: PlayerRole
  name?: string
  image?: {
    src: string
    alt?: string
  }
  stats?: {
    quizCorrect?: { value?: number; of?: number }
    messages?: number
    distanceKm?: number
    saidLove?: number
    photos?: number
  }
}

export interface ResultPayload {
  resultTitle?: string
  team?: {
    rank?: number
    totalDaysTogether?: number
  }
  players?: ResultPayloadPlayer[]
}

interface PlayerStatDisplay {
  key: StatKey
  label: string
  value: string
  ariaLabel: string
}

interface ResultPlayerView {
  role: PlayerRole
  name: string
  stats: PlayerStatDisplay[]
  image?: {
    src: string
    alt: string
  }
}

interface ResultViewData {
  resultTitle: string
  teamRank: {
    text: string
    ariaLabel: string
  }
  teamDays: {
    text: string
    ariaLabel: string
  }
  players: ResultPlayerView[]
}

const NUMBER_FORMAT = new Intl.NumberFormat('ja-JP')

const PLAYER_ROLES: PlayerRole[] = ['you', 'ally']

const PLAYER_DEFAULT_NAMES: Record<PlayerRole, string> = {
  you: '自分',
  ally: '味方',
}

const STAT_LABELS: Record<StatKey, string> = {
  quizCorrect: 'クイズ正解数',
  messages: '送ったメッセージ数',
  distanceKm: '合計移動距離',
  saidLove: '好きって言った回数',
  photos: '撮った写真枚数',
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatNumber = (value: unknown) => {
  if (!isFiniteNumber(value)) {
    return undefined
  }
  return NUMBER_FORMAT.format(value)
}

const buildDefaultStats = (): PlayerStatDisplay[] => [
  {
    key: 'quizCorrect',
    label: STAT_LABELS.quizCorrect,
    value: '— / 3',
    ariaLabel: 'クイズ正解数 — / 3',
  },
  {
    key: 'messages',
    label: STAT_LABELS.messages,
    value: '—',
    ariaLabel: '送ったメッセージ数 —',
  },
  {
    key: 'distanceKm',
    label: STAT_LABELS.distanceKm,
    value: '— km',
    ariaLabel: '合計移動距離 — キロメートル',
  },
  {
    key: 'saidLove',
    label: STAT_LABELS.saidLove,
    value: '—',
    ariaLabel: '好きって言った回数 —',
  },
  {
    key: 'photos',
    label: STAT_LABELS.photos,
    value: '—',
    ariaLabel: '撮った写真枚数 —',
  },
]

const createPlayerView = (role: PlayerRole, payload?: ResultPayloadPlayer): ResultPlayerView => {
  const name = payload?.name?.trim() || PLAYER_DEFAULT_NAMES[role]
  const stats = buildDefaultStats().map((stat) => {
    if (!payload?.stats) {
      return stat
    }

    if (stat.key === 'quizCorrect') {
      const quiz = payload.stats.quizCorrect
      const denominator = formatNumber(quiz?.of ?? 3) ?? '3'
      const formattedValue = formatNumber(quiz?.value)
      const value = formattedValue ?? '—'
      return {
        ...stat,
        value: `${value} / ${denominator}`,
        ariaLabel: `クイズ正解数 ${value} / ${denominator}`,
      }
    }

    if (stat.key === 'messages') {
      const formatted = formatNumber(payload.stats.messages)
      const value = formatted ?? '—'
      return {
        ...stat,
        value,
        ariaLabel: `送ったメッセージ数 ${value}`,
      }
    }

    if (stat.key === 'distanceKm') {
      const formatted = formatNumber(payload.stats.distanceKm)
      const value = formatted ? `${formatted} km` : '— km'
      return {
        ...stat,
        value,
        ariaLabel: `合計移動距離 ${formatted ?? '—'} キロメートル`,
      }
    }

    if (stat.key === 'saidLove') {
      const formatted = formatNumber(payload.stats.saidLove)
      const value = formatted ?? '—'
      return {
        ...stat,
        value,
        ariaLabel: `好きって言った回数 ${value}`,
      }
    }

    const formatted = formatNumber(payload.stats.photos)
    const value = formatted ?? '—'
    return {
      ...stat,
      value,
      ariaLabel: `撮った写真枚数 ${value}`,
    }
  })

  const src = payload?.image?.src?.trim()
  const alt = payload?.image?.alt?.trim()

  return {
    role,
    name,
    stats,
    image: src
      ? {
          src,
          alt: alt || `${name}のルーツ画像`,
        }
      : undefined,
  }
}

const buildViewData = (payload?: ResultPayload): ResultViewData => {
  const teamRankValue = formatNumber(payload?.team?.rank)
  const teamDaysValue = formatNumber(payload?.team?.totalDaysTogether)

  const playersByRole = new Map<PlayerRole, ResultPayloadPlayer>()
  payload?.players?.forEach((player) => {
    if (PLAYER_ROLES.includes(player.role)) {
      playersByRole.set(player.role, player)
    }
  })

  return {
    resultTitle: payload?.resultTitle?.trim() || 'forever',
    teamRank: {
      text: teamRankValue ? `${teamRankValue}位` : '— 位',
      ariaLabel: `部隊の順位 ${teamRankValue ?? '—'} 位`,
    },
    teamDays: {
      text: teamDaysValue ? `${teamDaysValue}日` : '〇〇日',
      ariaLabel: teamDaysValue
        ? `一緒に過ごした合計日数 ${teamDaysValue} 日`
        : '一緒に過ごした合計日数 未設定',
    },
    players: PLAYER_ROLES.map((role) => createPlayerView(role, playersByRole.get(role))),
  }
}

const DEFAULT_VIEW_DATA = buildViewData()

declare global {
  interface Window {
    setResultData?: (payload?: ResultPayload) => void
  }
}

const ResultPlayerCard = ({
  player,
  isActive,
}: {
  player: ResultPlayerView
  isActive: boolean
}) => {
  const headingId = `result-player-${player.role}`
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  useEffect(() => {
    setIsImageLoaded(false)
  }, [player.image?.src])

  return (
    <section
      className={`result-card${isActive ? ' is-active' : ''}`}
      role="group"
      aria-labelledby={headingId}
    >
      <div className="result-card__body">
        <header className="result-card__header">
          <p id={headingId} className="result-card__title">
            {player.name}
          </p>
        </header>
        <dl className="result-card__stats">
          {player.stats.map((stat) => (
            <div key={stat.key} className="result-card__stat">
              <dt className="result-card__label">{stat.label}</dt>
              <dd className="result-card__value" aria-label={stat.ariaLabel}>
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={`result-card__image${isImageLoaded ? ' is-loaded' : ''}`}>
        <div className="result-card__image-inner">
          <div className="result-card__image-placeholder" aria-hidden="true">
            <span>ルーツ画像を設定してください</span>
          </div>
          {player.image ? (
            <img
              src={player.image.src}
              alt={player.image.alt}
              loading="lazy"
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(false)}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

export const ResultScene = ({ onRestart }: SceneComponentProps) => {
  const [viewData, setViewData] = useState<ResultViewData>(DEFAULT_VIEW_DATA)
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)
  const { record } = useActionHistory()

  useEffect(() => {
    const handleSetData = (payload?: ResultPayload) => {
      const snapshot = {
        data: viewData,
        index: activePlayerIndex,
      }
      record(() => {
        setViewData(snapshot.data)
        setActivePlayerIndex(snapshot.index)
      }, { label: 'Result: update dataset' })

      setViewData(buildViewData(payload))
      setActivePlayerIndex(0)
    }

    window.setResultData = handleSetData

    return () => {
      if (window.setResultData === handleSetData) {
        delete window.setResultData
      }
    }
  }, [activePlayerIndex, record, viewData])

  const totalPlayers = viewData.players.length
  type TrackStyle = CSSProperties & { '--active-index'?: number }
  const trackStyle: TrackStyle = { '--active-index': activePlayerIndex }

  const stepPlayer = (direction: number) => {
    if (totalPlayers <= 1) {
      return
    }

    const label = direction < 0 ? 'Result: previous player' : 'Result: next player'
    const snapshotIndex = activePlayerIndex
    record(() => {
      setActivePlayerIndex(snapshotIndex)
    }, { label })

    setActivePlayerIndex((prev) => {
      const nextIndex = (prev + direction + totalPlayers) % totalPlayers
      return nextIndex < 0 ? nextIndex + totalPlayers : nextIndex
    })
  }

  const selectPlayer = (index: number) => {
    if (index < 0 || index >= totalPlayers) {
      return
    }
    if (index === activePlayerIndex) {
      return
    }
    const snapshotIndex = activePlayerIndex
    record(() => {
      setActivePlayerIndex(snapshotIndex)
    }, { label: `Result: select player ${index + 1}` })
    setActivePlayerIndex(index)
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      return
    }
    touchStartXRef.current = event.touches[0].clientX
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current
    touchStartXRef.current = null

    if (startX === null || event.changedTouches.length === 0) {
      return
    }

    const deltaX = event.changedTouches[0].clientX - startX
    if (Math.abs(deltaX) < 40) {
      return
    }

    stepPlayer(deltaX > 0 ? -1 : 1)
  }

  const handleTouchCancel = () => {
    touchStartXRef.current = null
  }

  return (
    <SceneLayout hideHeader>
      <div className="result-screen" role="presentation">
        <div className="result-screen__backdrop" aria-hidden="true" />

        <header className="result-screen__header">
          <nav className="result-tabbar" aria-label="リザルトタブ">
            <ul className="result-tabbar__list">
              <li className="result-tabbar__item">
                <span className="result-tabbar__label">観戦</span>
              </li>
              <li className="result-tabbar__item">
                <span className="result-tabbar__label">戦闘データ</span>
              </li>
              <li className="result-tabbar__item is-active" aria-current="page">
                <span className="result-tabbar__label">リザルト</span>
              </li>
            </ul>
          </nav>

          <div className="result-header__divider" aria-hidden="true" />

          <section
            className="result-banner"
            aria-live="polite"
            aria-label="勝利バナー"
          >
            <div className="result-banner__surface" aria-hidden="true" />
            <div className="result-banner__streak" aria-hidden="true" />
            <p className="result-banner__title">{viewData.resultTitle}</p>
            <div className="result-banner__stats">
              <div className="result-banner__panel">
                <span className="result-banner__panel-label">部隊の順位</span>
                <span
                  className="result-banner__panel-value"
                  aria-label={viewData.teamRank.ariaLabel}
                >
                  {viewData.teamRank.text}
                </span>
              </div>
              <div className="result-banner__panel">
                <span className="result-banner__panel-label">一緒に過ごした合計日数</span>
                <span
                  className="result-banner__panel-value"
                  aria-label={viewData.teamDays.ariaLabel}
                >
                  {viewData.teamDays.text}
                </span>
              </div>
            </div>
          </section>
        </header>

        <section className="result-cards" aria-label="プレイヤー成績">
          <div
            className="result-cards__viewport"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div className="result-cards__track" style={trackStyle}>
              {viewData.players.map((player, index) => (
                <ResultPlayerCard
                  key={player.role}
                  player={player}
                  isActive={index === activePlayerIndex}
                />
              ))}
            </div>
          </div>

          {totalPlayers > 1 ? (
            <div className="result-cards__nav" aria-label="プレイヤーの切り替え">
              <button
                type="button"
                className="result-cards__nav-button result-cards__nav-button--prev"
                onClick={() => stepPlayer(-1)}
                aria-label="前のプレイヤー"
              >
                ‹
              </button>
              <div className="result-cards__dots" role="tablist" aria-label="プレイヤー選択">
                {viewData.players.map((player, index) => (
                  <button
                    key={player.role}
                    type="button"
                    role="tab"
                    className={`result-cards__dot${
                      index === activePlayerIndex ? ' is-active' : ''
                    }`}
                    onClick={() => selectPlayer(index)}
                    aria-label={`${player.name}を表示`}
                    aria-selected={index === activePlayerIndex}
                  />
                ))}
              </div>
              <button
                type="button"
                className="result-cards__nav-button result-cards__nav-button--next"
                onClick={() => stepPlayer(1)}
                aria-label="次のプレイヤー"
              >
                ›
              </button>
            </div>
          ) : null}
        </section>

        <div className="result-action">
          <button type="button" className="result-action__button" onClick={onRestart}>
            ロビーに戻る
          </button>
        </div>
      </div>
    </SceneLayout>
  )
}
