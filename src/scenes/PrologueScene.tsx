import { useCallback, useState } from 'react'

import { prologueScript } from '../data/prologue'
import type { SceneComponentProps } from '../types/scenes'

const CALL_LABELS = [
  'シンクロリンク確立',
  '夜空回線 稼働中',
  '時刻同期 完了間近',
]

export const PrologueScene = ({ onAdvance }: SceneComponentProps) => {
  const [visibleCount, setVisibleCount] = useState(1)

  const isComplete = visibleCount >= prologueScript.length
  const activeLabel = CALL_LABELS[Math.max(0, (visibleCount - 1) % CALL_LABELS.length)]

  const handleAdvance = useCallback(() => {
    setVisibleCount((current) => {
      if (current >= prologueScript.length) {
        onAdvance()
        return current
      }

      return Math.min(current + 1, prologueScript.length)
    })
  }, [onAdvance])

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
      <div className="prologue__backdrop" aria-hidden="true" />
      <div className="prologue__content">
        <header className="prologue__call-ui" aria-live="polite">
          <div className="prologue__call-id">
            <span className="prologue__call-avatar" aria-hidden="true">
              ✦
            </span>
            <div>
              <p className="prologue__call-label">彼女 — Rooftop Channel</p>
              <p className="prologue__call-status">{activeLabel}</p>
            </div>
          </div>
          <div className="prologue__call-meter" aria-hidden="true">
            <span className={visibleCount > 2 ? 'is-active' : ''} />
            <span className={visibleCount > 4 ? 'is-active' : ''} />
            <span className={visibleCount > 6 ? 'is-active' : ''} />
          </div>
        </header>

        <div className="prologue__dialogue" role="presentation">
          {prologueScript.slice(0, visibleCount).map((line) => (
            <div
              key={line.id}
              className={`prologue-line prologue-line--${line.variant}`}
            >
              {line.speaker ? (
                <span className="prologue-line__speaker">{line.speaker}</span>
              ) : null}
              <p className="prologue-line__text">{line.text}</p>
            </div>
          ))}
        </div>

        <footer className="prologue__footer" aria-hidden="true">
          <div className="prologue__progress">
            {prologueScript.map((line, index) => (
              <span
                key={line.id}
                className={index < visibleCount ? 'is-active' : undefined}
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
