import { useEffect, useMemo, useState } from 'react'

import { CanvasMemoryStream } from '../components/CanvasMemoryStream'
import { messageMilestones, totalMessages } from '../data/messages'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) => value.toLocaleString('ja-JP')

// フルブリードのメディアアートに刷新したMessagesシーン
export const MessagesScene = ({ onAdvance }: SceneComponentProps) => {
  const targetTotal = totalMessages
  const [count, setCount] = useState(0)

  // 文字プール（既存のプレビューとハイライトを合成）
  const messageStrings = useMemo(() => {
    const out: string[] = []
    messageMilestones.forEach((m) => {
      m.preview.forEach((p) => out.push(p.text))
      m.highlight.split('。').forEach((s) => {
        const t = s.trim()
        if (t) out.push(t)
      })
    })
    return out.length ? out : ['だいすき']
  }, [])

  // カウントが満了したら自動前進
  useEffect(() => {
    if (count >= targetTotal) {
      const t = setTimeout(() => onAdvance(), 900)
      return () => clearTimeout(t)
    }
  }, [count, targetTotal, onAdvance])

  const handleReveal = () => {
    setCount((c) => (c < targetTotal ? c + 1 : c))
  }

  return (
    <section className="messages-full" role="presentation" aria-label="画面全体で文字の流れを楽しむメディアアート">
      {/* フルブリードCanvas（背景メディアアート） */}
      <CanvasMemoryStream messages={messageStrings} onReveal={handleReveal} />

      {/* 極小HUD（枠なし・重ね文字） */}
      <header className="messages-hud" aria-hidden>
        <div className="messages-hud__left">
          <p className="messages-eyebrow">MESSAGES</p>
          <p className="messages-sub">夜空に言葉を流す</p>
        </div>
      </header>

      {/* 画面中央の大きなカウント */}
      <div className="messages-count-center" aria-hidden>
        {formatNumber(count)}
      </div>

      <div className="messages-hint">タップで流す</div>
    </section>
  )
}
