import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const MessagesScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Messages"
      title="メッセージの積み上げ"
      description="バブルが増えていき合計メッセージ数を表示する演出。距離HUDと連動し、クイズの伏線を仕込みます。"
      onAdvance={onAdvance}
      advanceLabel="Likesへ"
    >
      <ol className="scene-list">
        <li>チャットバブルがタップ毎に追加され、合計カウンターが弾けるアニメ。</li>
        <li>途中でクイズ『最もメッセージが多かった月は？』を挟む予定。</li>
        <li>サウンドはM8で検討。まずはモーションのみで世界観を作ります。</li>
      </ol>
    </SceneLayout>
  )
}
