import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  CanvasHeartWaves,
  DEFAULT_HEART_WAVE_SETTINGS,
  type HeartWaveSettings,
} from '../components/CanvasHeartWaves'
import { totalLikes } from '../data/likes'
import type { SceneComponentProps } from '../types/scenes'

const FINAL_TARGET = totalLikes
const TAPS_TO_COMPLETE = 42
const TAP_INCREMENT = Math.ceil(FINAL_TARGET / TAPS_TO_COMPLETE)

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const LikesScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(24, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'>(
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [showTopLine, setShowTopLine] = useState(false)
  const [showBottomLine, setShowBottomLine] = useState(false)
  const [waveSettings, setWaveSettings] = useState<HeartWaveSettings>(
    () => ({ ...DEFAULT_HEART_WAVE_SETTINGS })
  )
  const [controlsOpen, setControlsOpen] = useState(true)
  const [panelRoot, setPanelRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const host = document.createElement('div')
    host.className = 'likes-control-host'
    document.body.appendChild(host)
    setPanelRoot(host)
    return () => {
      document.body.removeChild(host)
      setPanelRoot(null)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'play') return
    if (count >= FINAL_TARGET) {
      setPhase('announce')
    }
  }, [count, phase])

  useEffect(() => {
    if (phase !== 'announce') return
    setShowTopLine(false)
    setShowBottomLine(false)
    setCtaVisible(false)
    const t1 = setTimeout(() => setShowTopLine(true), 1200)
    const t2 = setTimeout(() => setShowBottomLine(true), 2600)
    const t3 = setTimeout(() => {
      setCtaVisible(true)
      setPhase('cta')
    }, 4600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [phase])

  const handlePulse = () => {
    if (phase !== 'play') return
    const step = Math.max(1, Math.ceil(TAP_INCREMENT / 2))
    let iteration = 0
    const tick = () => {
      setCount((prev) => {
        if (prev >= FINAL_TARGET) return prev
        const next = Math.min(FINAL_TARGET, prev + step)
        return next
      })
      iteration += 1
      if (iteration < 2) {
        setTimeout(tick, 140)
      }
    }
    tick()
  }

  return (
    <section
      className="likes-full"
      role="presentation"
      aria-label="好きのカウントをハートのメディアアートで楽しむ"
    >
      <CanvasHeartWaves
        disabled={phase !== 'play'}
        onPulse={handlePulse}
        settings={waveSettings}
      />

      <div className="likes-count-center" aria-hidden>
        {formatNumber(count)}
      </div>

      {phase !== 'play' && (
        <div className="likes-announce" role="status">
          <div className="likes-announce__layout">
            {showTopLine && (
              <p className="likes-announce__line likes-announce__line--top">
                １年間で重ねた「好き」は
              </p>
            )}
            {showBottomLine && (
              <p className="likes-announce__line likes-announce__line--bottom">
                全部でこの回数になりました。
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <div className="likes-cta-wrap">
          <button
            type="button"
            className="likes-cta"
            onClick={onAdvance}
          >
            タップで次へ
          </button>
        </div>
      )}

      {panelRoot
        ? createPortal(
            <div
              className={`likes-control-layer${controlsOpen ? ' is-open' : ''}`}
              aria-live="polite"
            >
              <button
                type="button"
                className="likes-control-toggle"
                onClick={() => setControlsOpen((prev) => !prev)}
              >
                {controlsOpen ? 'HIDE CONTROL' : 'SHOW CONTROL'}
              </button>
              <aside
                className="likes-control-panel"
                aria-label="Likes演出の調整パネル"
              >
                <header className="likes-control-panel__header">
                  <h2 className="likes-control-panel__title">
                    MEDIA ART CONTROL
                  </h2>
                  <div className="likes-control-panel__actions">
                    <button
                      type="button"
                      className="likes-control-panel__action"
                      onClick={() => setWaveSettings({ ...DEFAULT_HEART_WAVE_SETTINGS })}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="likes-control-panel__action"
                      onClick={() => setControlsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </header>
                <div className="likes-control-panel__grid">
          <label className="likes-control-panel__field">
            <span>Ripple Lifetime (ms)</span>
            <input
              type="number"
              min={600}
              max={12000}
              step={50}
              value={waveSettings.rippleLifetime}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, rippleLifetime: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Radius Factor</span>
            <input
              type="number"
              min={0.2}
              max={4}
              step={0.05}
              value={waveSettings.rippleRadiusFactor}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, rippleRadiusFactor: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Base Scale Min (px)</span>
            <input
              type="number"
              min={12}
              max={240}
              step={2}
              value={waveSettings.baseScaleMinPx}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, baseScaleMinPx: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Ring Thickness Ratio</span>
            <input
              type="number"
              min={0.01}
              max={0.6}
              step={0.01}
              value={waveSettings.ringThicknessRatio}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, ringThicknessRatio: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Min Ring Thickness (px)</span>
            <input
              type="number"
              min={2}
              max={120}
              step={1}
              value={waveSettings.minRingThicknessPx}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, minRingThicknessPx: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Glow Thickness Ratio</span>
            <input
              type="number"
              min={0.01}
              max={0.8}
              step={0.01}
              value={waveSettings.glowThicknessRatio}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, glowThicknessRatio: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Min Glow Thickness (px)</span>
            <input
              type="number"
              min={2}
              max={240}
              step={1}
              value={waveSettings.minGlowThicknessPx}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, minGlowThicknessPx: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Highlight Ratio</span>
            <input
              type="number"
              min={0.1}
              max={1}
              step={0.01}
              value={waveSettings.highlightRatio}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, highlightRatio: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Alpha Start</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={waveSettings.alphaStart}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, alphaStart: next }))
              }}
            />
          </label>
          <label className="likes-control-panel__field">
            <span>Alpha Falloff</span>
            <input
              type="number"
              min={0}
              max={2}
              step={0.01}
              value={waveSettings.alphaFalloff}
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (Number.isNaN(next)) return
                setWaveSettings((prev) => ({ ...prev, alphaFalloff: next }))
              }}
            />
          </label>
        </div>
                <pre className="likes-control-panel__snapshot">
{JSON.stringify(waveSettings, null, 2)}
                </pre>
              </aside>
            </div>,
            panelRoot
          )
        : null}

    </section>
  )
}
