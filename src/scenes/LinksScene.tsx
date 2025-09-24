import { useEffect, useState } from 'react'

import { TapRippleField } from '../components/TapRippleField'
import { linkExchangeCounts, totalLinks } from '../data/links'
import type { SceneComponentProps } from '../types/scenes'

const FINAL_TARGET = totalLinks
const TAP_INCREMENT = Math.max(1, Math.ceil(FINAL_TARGET / 32))

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

export const LinksScene = ({ onAdvance }: SceneComponentProps) => {
  const [count, setCount] = useState(() => Math.min(10, FINAL_TARGET))
  const [phase, setPhase] = useState<'play' | 'announce' | 'cta'> (
    FINAL_TARGET > 0 ? 'play' : 'announce'
  )
  const [ctaVisible, setCtaVisible] = useState(false)
  const [showLines, setShowLines] = useState(false)

  useEffect(() => {
    if (phase !== 'play') return
    if (count >= FINAL_TARGET) {
      setPhase('announce')
    }
  }, [count, phase])

  useEffect(() => {
    if (phase !== 'announce') return
    setShowLines(false)
    setCtaVisible(false)
    const timerLine = window.setTimeout(() => setShowLines(true), 900)
    const timerCta = window.setTimeout(() => {
      setCtaVisible(true)
      setPhase('cta')
    }, 3600)
    return () => {
      window.clearTimeout(timerLine)
      window.clearTimeout(timerCta)
    }
  }, [phase])

  const handlePulse = () => {
    if (phase !== 'play') return
    setCount((prev) => Math.min(FINAL_TARGET, prev + TAP_INCREMENT))
  }

  return (
    <section
      className="links-full"
      role="presentation"
      aria-label="共有したリンクの記録を水面のネットワークで振り返る"
    >
      <TapRippleField
        disabled={phase !== 'play'}
        onPulse={handlePulse}
        variant="links"
      />

      <div className="links-count" aria-hidden>
        {formatNumber(count)}
      </div>

      <div className="links-meta" aria-hidden>
        <p>あなた → 彼女 {formatNumber(linkExchangeCounts.fromYou)} 件</p>
        <p>彼女 → あなた {formatNumber(linkExchangeCounts.fromPartner)} 件</p>
      </div>

      {phase !== 'play' && (
        <div
          className={`links-caption${showLines ? ' is-visible' : ''}`}
          role="status"
        >
          <p>一年で交差したリンクの光跡。</p>
          <p>全部でこの数だけネットワークに載りました。</p>
        </div>
      )}

      {phase === 'cta' && ctaVisible && (
        <div className="links-cta">
          <button type="button" onClick={onAdvance}>
            タップで次へ
          </button>
        </div>
      )}
    </section>
  )
}
