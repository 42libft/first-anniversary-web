import { useEffect, useState } from 'react'
import { AsciiStartScene } from '../components/AsciiStartScene'
import type { SceneComponentProps } from '../types/scenes'

const BOOT_LINES = [
  '>> anniv://boot — initializing',
  '... loading assets (ascii, ui, scenes)',
  '... linking memories (365 days)',
  '... preparing journeys (Tokyo ⇄ Fukuoka)',
  '... mounting start-screen',
  'READY — tap to continue',
]

const useBootLines = () => {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (index >= BOOT_LINES.length - 1) return
    const t = setTimeout(() => setIndex((i) => i + 1), 520)
    return () => clearTimeout(t)
  }, [index])
  return BOOT_LINES.slice(0, index + 1)
}

export const IntroScene = ({ onAdvance }: SceneComponentProps) => {
  const lines = useBootLines()
  const [stage, setStage] = useState<'boot' | 'start'>('boot')

  useEffect(() => {
    if (stage !== 'boot') return
    if (lines.length >= BOOT_LINES.length) {
      const t = setTimeout(() => setStage('start'), 650)
      return () => clearTimeout(t)
    }
  }, [stage, lines])

  const handleClick = () => {
    if (stage === 'boot') setStage('start')
    else onAdvance()
  }

  return (
    <section className="scene-layout" role="button" onClick={handleClick} aria-label="Tap to start">
      {stage === 'boot' ? (
        <div className="scene-layout__content">
          <p className="scene-layout__eyebrow">Boot Sequence</p>
          <h1 className="scene-layout__title">Program Initializing</h1>
          <p className="scene-layout__description">タップでスキップできます。</p>
          <div className="scene-layout__body">
            <div className="terminal" role="status" aria-live="polite" style={{ maxHeight: '55vh' }}>
              {lines.map((l, i) => (
                <div className="terminal__line" key={i}>
                  {i === lines.length - 1 ? (<>{l}<span className="terminal__cursor" aria-hidden="true" /></>) : l}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <AsciiStartScene />
          <div className="scene-layout__content">
            <p className="scene-layout__eyebrow">Start</p>
            <h1 className="scene-layout__title">TITLE PLACEHOLDER</h1>
            <p className="scene-layout__description">SUBTITLE PLACEHOLDER</p>
          </div>
          <div className="tap-indicator" aria-hidden="true">
            <span className="tap-indicator__dot" /> TAP ANYWHERE TO START
          </div>
        </>
      )}
    </section>
  )
}
