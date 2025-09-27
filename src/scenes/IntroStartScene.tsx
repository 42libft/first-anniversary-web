import { useEffect } from 'react'

import { AsciiStartScene } from '../components/AsciiStartScene'
import { GlobalStarfield } from '../components/GlobalStarfield'
import type { SceneComponentProps } from '../types/scenes'

export const IntroStartScene = ({
  onAdvance,
  reportIntroBootState,
}: SceneComponentProps) => {
  useEffect(() => {
    reportIntroBootState?.('ready')
  }, [reportIntroBootState])

  return (
    <section
      className="intro-scene stage-start"
      role="button"
      tabIndex={0}
      onClick={onAdvance}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onAdvance()
        }
      }}
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
    </section>
  )
}
