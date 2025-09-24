import { useEffect, useState } from 'react'

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
  const [waveSettings] = useState<HeartWaveSettings>(
    () => ({ ...DEFAULT_HEART_WAVE_SETTINGS })
  )

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

    </section>
  )
}
