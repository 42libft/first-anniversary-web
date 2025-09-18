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
  const [effectsOn, setEffectsOn] = useState(false)

  useEffect(() => {
    const prefersReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduce) {
      setEffectsOn(true)
      document.body.classList.add('force-motion')
    }
    return () => {
      document.body.classList.remove('force-motion')
    }
  }, [])

  const handleAdvance = () => onAdvance()
  const toggleEffects = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !effectsOn
    setEffectsOn(next)
    document.body.classList.toggle('force-motion', next)
  }

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
        <div className="intro-sky__shooting intro-sky__shooting--2" />
        <div className="intro-sky__shooting intro-sky__shooting--3" />
        <div className="intro-vignette" />
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
                {i === lines.length - 1 ? (
                  <>
                    {l}
                    <span className="terminal__cursor" aria-hidden="true" />
                  </>
                ) : (
                  l
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className="primary-button" onClick={handleAdvance}>
        Tap to start
      </button>

      <div className="tap-indicator" aria-hidden="true">
        <span className="tap-indicator__dot" /> TAP ANYWHERE
      </div>

      <button
        type="button"
        aria-label="Toggle visual effects"
        onClick={toggleEffects}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          right: '12px',
          background: 'rgba(12,18,52,0.6)',
          color: '#cdd7ff',
          border: '1px solid rgba(163,174,255,0.35)',
          borderRadius: 999,
          padding: '6px 10px',
          fontSize: '12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        FX: {effectsOn ? 'ON' : 'OFF'}
      </button>
    </section>
  )
}
