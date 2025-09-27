import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from 'react'

import { AsciiStartScene } from '../components/AsciiStartScene'
import { GlobalStarfield } from '../components/GlobalStarfield'
import type { SceneComponentProps } from '../types/scenes'

export const IntroStartScene = ({
  onAdvance,
  reportIntroBootState,
}: SceneComponentProps) => {
  const [showNotice, setShowNotice] = useState(false)
  const okButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    reportIntroBootState?.('ready')
  }, [reportIntroBootState])

  useEffect(() => {
    if (showNotice) {
      okButtonRef.current?.focus()
    }
  }, [showNotice])

  const handleActivate = () => {
    if (showNotice) {
      return
    }
    setShowNotice(true)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!showNotice) {
        setShowNotice(true)
      }
    }
  }

  const handleConfirm = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setShowNotice(false)
    onAdvance()
  }

  return (
    <section
      className="intro-scene stage-start"
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label="Tap to start experience"
    >
      <GlobalStarfield />
      <AsciiStartScene />
      <div className="start-ui">
        <h1 className="start-title">TITLE PLACEHOLDER</h1>
        <p className="start-subtitle">SUBTITLE PLACEHOLDER</p>
        <div className="start-tap">
          <span className="tap-dot" /> TAP ANYWHERE TO START
        </div>
      </div>

      {showNotice && (
        <div
          className="start-notice-overlay"
          role="presentation"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="start-notice-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-notice-title"
            aria-describedby="start-notice-description"
          >
            <h2 id="start-notice-title" className="start-notice-dialog__title">
              NOTICE
            </h2>
            <p id="start-notice-description" className="start-notice-dialog__body">
              This experience progresses mainly by tapping. If you advance by mistake, use the back button at the bottom-left to return one step.
            </p>
            <button
              type="button"
              className="primary-button start-notice-dialog__button"
              onClick={handleConfirm}
              ref={okButtonRef}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
