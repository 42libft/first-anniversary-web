import { useCallback, useEffect, useState } from 'react'

import { prologueScript } from '../data/prologue'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'

const CALL_LABELS = ['RTC接続中']
const CALL_AVATAR_SRC = '/images/gimmie-placeholder.svg'

export const PrologueScene = ({ onAdvance }: SceneComponentProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const totalLines = prologueScript.length
  const isComplete = activeIndex >= totalLines - 1
  const activeLabel = CALL_LABELS[Math.min(activeIndex, CALL_LABELS.length - 1)]
  const currentLine = prologueScript[activeIndex]
  const [activeBackdrop, setActiveBackdrop] = useState<'self' | 'partner'>(() => {
    const firstSpeaker = prologueScript.find((line) =>
      line.variant === 'self' || line.variant === 'partner'
    )?.variant

    return firstSpeaker === 'partner' ? 'partner' : 'self'
  })
  const { record } = useActionHistory()

  useEffect(() => {
    if (currentLine?.variant === 'self' || currentLine?.variant === 'partner') {
      setActiveBackdrop(currentLine.variant)
    }
  }, [currentLine?.variant])

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
    >
      <div className="prologue__backdrops" aria-hidden="true">
        <div
          className={`prologue__backdrop prologue__backdrop--self ${
            activeBackdrop === 'self' ? 'is-active' : ''
          }`}
        />
        <div
          className={`prologue__backdrop prologue__backdrop--partner ${
            activeBackdrop === 'partner' ? 'is-active' : ''
          }`}
        />
        <div className="prologue__backdrop-overlay" />
      </div>
      <div className="prologue__content">
        <header className="prologue__call-ui" aria-live="polite">
          <div className="prologue__call-id">
            <div className="prologue__call-avatar">
              <img
                src={CALL_AVATAR_SRC}
                alt="Gimmie x Gimmieのサーバーアイコン"
                loading="lazy"
              />
            </div>
            <div>
              <p className="prologue__call-label">彩音 — Gimmie x Gimmie</p>
              <p className="prologue__call-status">{activeLabel}</p>
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
          <div className="prologue__progress">
            {prologueScript.map((line, index) => (
              <span
                key={line.id}
                className={index <= activeIndex ? 'is-active' : undefined}
              />
            ))}
          </div>
          <p className="prologue__hint">
            {isComplete ? 'タップでJourneysへ' : 'タップで続ける'}
          </p>
        </footer>
      </div>
    </section>
  )
}
