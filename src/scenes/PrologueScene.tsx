import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { prologueScript } from '../data/prologue'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'
import { resolveAssetPath } from '../utils/resolveAssetPath'

const SPEAKER_PROFILES = {
  self: {
    name: 'libft',
    avatars: {
      idle: '/images/prologue/Generated Image September 26, 2025 - 2_48AM.png',
      speaking: '/images/prologue/Generated Image September 26, 2025 - 2_55AM.png',
    },
  },
  partner: {
    name: 'れおん',
    avatars: {
      idle: '/images/prologue/Generated Image September 26, 2025 - 3_34AM.png',
      speaking: '/images/prologue/Generated Image September 26, 2025 - 3_37AM.png',
    },
  },
} as const

const SERVER_PROFILE = {
  name: 'NESSI',
  avatar: resolveAssetPath('/images/prologue/IMG_nessi.jpeg'),
} as const

const FALLBACK_AVATAR_SRC = resolveAssetPath('/images/prologue-partner-placeholder.svg')

const toCssUrl = (path: string) => `url("${path}")`

const SPEAKER_BACKDROP_IMAGES = {
  self: {
    idle: toCssUrl(resolveAssetPath(SPEAKER_PROFILES.self.avatars.idle)),
    speaking: toCssUrl(resolveAssetPath(SPEAKER_PROFILES.self.avatars.speaking)),
  },
  partner: {
    idle: toCssUrl(resolveAssetPath(SPEAKER_PROFILES.partner.avatars.idle)),
    speaking: toCssUrl(resolveAssetPath(SPEAKER_PROFILES.partner.avatars.speaking)),
  },
} as const

const getInitialSpeaker = (): 'self' | 'partner' => {
  const firstSpeaker = prologueScript.find(
    (line) => line.variant === 'self' || line.variant === 'partner'
  )?.variant

  return firstSpeaker === 'partner' ? 'partner' : 'self'
}

export const PrologueScene = ({ onAdvance }: SceneComponentProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const totalLines = prologueScript.length
  const isComplete = activeIndex >= totalLines - 1
  const currentLine = prologueScript[activeIndex]
  const [activeBackdrop, setActiveBackdrop] = useState<'self' | 'partner'>(getInitialSpeaker)
  const [activeSpeaker, setActiveSpeaker] = useState<'self' | 'partner'>(getInitialSpeaker)
  const { record } = useActionHistory()
  const showCallStatus = activeIndex === 0
  const activeSpeakerProfile = SPEAKER_PROFILES[activeSpeaker]
  const isSelfLine = currentLine?.variant === 'self'
  const isPartnerLine = currentLine?.variant === 'partner'
  const isSystemLine = currentLine?.variant === 'system'

  const displayName = isSystemLine
    ? SERVER_PROFILE.name
    : isSelfLine
    ? SPEAKER_PROFILES.self.name
    : isPartnerLine
    ? SPEAKER_PROFILES.partner.name
    : activeSpeakerProfile.name

  const displayAvatarSrc = SERVER_PROFILE.avatar
  const displayAvatarAlt = `${SERVER_PROFILE.name}のアイコン`

  const backdropCustomProperties = useMemo(
    () =>
      ({
        '--prologue-self-idle-image': SPEAKER_BACKDROP_IMAGES.self.idle,
        '--prologue-self-speaking-image': SPEAKER_BACKDROP_IMAGES.self.speaking,
        '--prologue-partner-idle-image': SPEAKER_BACKDROP_IMAGES.partner.idle,
        '--prologue-partner-speaking-image': SPEAKER_BACKDROP_IMAGES.partner.speaking,
      }) as CSSProperties,
    []
  )

  useEffect(() => {
    if (currentLine?.variant === 'self' || currentLine?.variant === 'partner') {
      setActiveBackdrop(currentLine.variant)
      setActiveSpeaker(currentLine.variant)
    }
  }, [currentLine?.variant])

  const handleAvatarError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null
    event.currentTarget.src = FALLBACK_AVATAR_SRC
  }, [])

  const handleAdvance = useCallback(() => {
    if (activeIndex >= totalLines - 1) {
      onAdvance()
      return
    }

    const snapshot = {
      index: activeIndex,
      backdrop: activeBackdrop,
    }

    record(() => {
      setActiveIndex(snapshot.index)
      setActiveBackdrop(snapshot.backdrop)
    }, { label: 'Prologue: advance line' })

    setActiveIndex((current) => Math.min(current + 1, totalLines - 1))
  }, [activeBackdrop, activeIndex, onAdvance, record, totalLines])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleAdvance()
      }
    },
    [handleAdvance]
  )

  return (
    <section
      className="prologue"
      role="button"
      tabIndex={0}
      onClick={handleAdvance}
      onKeyDown={handleKeyDown}
      aria-label={isComplete ? 'Journeysへ進む' : 'タップでセリフを進める'}
      style={backdropCustomProperties}
    >
      <div className="prologue__backdrops" aria-hidden="true">
        <div
          className={`prologue__backdrop prologue__backdrop--self ${
            activeBackdrop === 'self' ? 'is-active' : ''
          } ${isSelfLine ? 'is-speaking' : ''}`}
        />
        <div
          className={`prologue__backdrop prologue__backdrop--partner ${
            activeBackdrop === 'partner' ? 'is-active' : ''
          } ${isPartnerLine ? 'is-speaking' : ''}`}
        />
      </div>
      <div className="prologue__content">
        <header className="prologue__call-ui" aria-live="polite">
          <div className="prologue__call-id">
            <div className="prologue__call-avatar">
              <img
                src={displayAvatarSrc}
                alt={displayAvatarAlt}
                onError={handleAvatarError}
                loading="lazy"
              />
            </div>
            <div>
              <p className="prologue__call-label">
                {displayName} — GIMMIE X GIMMIE
              </p>
              {showCallStatus ? (
                <p className="prologue__call-status">RTC接続中</p>
              ) : null}
            </div>
          </div>
          <div className="prologue__call-meter" aria-hidden="true">
            {([0.33, 0.66, 0.92] as const).map((threshold) => (
              <span
                key={threshold}
                className={
                  activeIndex / Math.max(totalLines - 1, 1) >= threshold ? 'is-active' : ''
                }
              />
            ))}
          </div>
        </header>

        <div className="prologue__dialogue" role="presentation">
          {currentLine ? (
            <div key={currentLine.id} className={`prologue-line prologue-line--${currentLine.variant}`}>
              {currentLine.speaker ? (
                <span className="prologue-line__speaker">{currentLine.speaker}</span>
              ) : null}
              <p className="prologue-line__text">{currentLine.text}</p>
            </div>
          ) : null}
        </div>

        <footer className="prologue__footer" aria-hidden="true">
          <p className="prologue__hint">
            {isComplete ? 'タップでJourneysへ' : 'タップで続ける'}
          </p>
        </footer>
      </div>
    </section>
  )
}
