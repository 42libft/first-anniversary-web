import { useEffect, useState } from 'react'
import { AsciiStartScene } from '../components/AsciiStartScene'
import { GlobalStarfield } from '../components/GlobalStarfield'
import type { SceneComponentProps } from '../types/scenes'

const BOOT_LINES = [
  'anniv$ sudo ./boot --year=1',
  'installing: night-sky, constellations, stardust',
  'installing: festival-yatai, lanterns, warm-lights',
  'loading: memories (Tokyo ⇄ Fukuoka, 12 trips)',
  'mounting: start-screen (ascii, retro-ui)',
  'checksum: OK — ready',
]
const BOOT_DELAYS = [900, 1400, 1100, 1600, 1200, 1500]

const useBootLines = () => {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (index >= BOOT_LINES.length - 1) return
    const t = setTimeout(() => setIndex((i) => i + 1), BOOT_DELAYS[index] ?? 700)
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
    if (stage === 'start') onAdvance()
  }

  return (
    <section className="scene-layout" role="button" onClick={handleClick} aria-label="Tap to start">
      {stage === 'boot' ? (
        <div style={{
          width: '100%',
          display: 'grid',
          placeItems: 'center',
          minHeight: '60vh',
        }}>
          <div className="terminal" role="status" aria-live="polite" style={{ width: 'min(720px, 88vw)', maxHeight: '60vh' }}>
            {lines.map((l, i) => (
              <div className="terminal__line" key={i}>
                {i === lines.length - 1 ? (<>{l}<span className="terminal__cursor" aria-hidden="true" /></>) : l}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Night sky + moon only on start screen */}
          <GlobalStarfield />
          <AsciiStartScene />
          <div className="start-ui">
            <h1 className="start-title">TITLE PLACEHOLDER</h1>
            <p className="start-subtitle">SUBTITLE PLACEHOLDER</p>
            <div className="start-tap"><span className="tap-dot" /> TAP ANYWHERE TO START</div>
          </div>
        </>
      )}
    </section>
  )
}
