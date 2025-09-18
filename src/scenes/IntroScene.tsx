import { useEffect, useRef, useState } from 'react'
import type { SceneComponentProps } from '../types/scenes'

const BOOT_LINES = [
  '>> ANNIV.EXE v1.0 — boot sequence',
  '... linking constellations',
  '... loading shared memories (1 year)',
  '... preparing journeys (Tokyo ⇄ Fukuoka)',
  '... enabling safe-area layout',
  'READY — tap to start',
]

const useBootLines = () => {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (index >= BOOT_LINES.length - 1) return
    const t = setTimeout(() => setIndex((i) => i + 1), 550)
    return () => clearTimeout(t)
  }, [index])
  return BOOT_LINES.slice(0, index + 1)
}

export const IntroScene = ({ onAdvance }: SceneComponentProps) => {
  const lines = useBootLines()
  const sectionRef = useRef<HTMLElement | null>(null)

  const handleAdvance = () => onAdvance()

  return (
    <section
      ref={sectionRef as any}
      className="scene-layout"
      role="button"
      onClick={handleAdvance}
      aria-label="Tap to start"
    >
      <div className="intro-sky" aria-hidden="true">
        <div className="intro-sky__layer" />
        <div className="intro-sky__layer intro-sky__layer--2" />
        <div className="intro-sky__shooting" />
      </div>

      <div className="scene-layout__content">
        <p className="scene-layout__eyebrow">Boot Sequence</p>
        <h1 className="scene-layout__title">FIRST ANNIVERSARY PROGRAM</h1>
        <p className="scene-layout__description">
          Tap anywhere to start. 夜空のゲートウェイから、ふたりの一年が始まる。
        </p>
        <div className="scene-layout__body">
          <div className="terminal" role="status" aria-live="polite">
            {lines.map((l, i) => (
              <div className="terminal__line" key={i}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className="primary-button" onClick={handleAdvance}>
        Tap to start
      </button>
    </section>
  )
}
