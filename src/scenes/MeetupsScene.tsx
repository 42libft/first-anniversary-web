import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const MeetupsScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Meetups"
      title="月ごとのアルバム"
      description="月替わりのメディアアート背景に写真と手書きメモを載せる、展示会のようなギャラリーセクション。"
      onAdvance={onAdvance}
      advanceLabel="Letterへ"
    >
      <ul className="scene-list">
        <li>縦横比の異なるiPhone写真に対応するレイアウトを検討中。</li>
        <li>スワイプ風のトランジションで月を切り替え、没入感を演出。</li>
        <li>ここでも自由回答を差し込める余白を用意します。</li>
      </ul>
    </SceneLayout>
  )
}
