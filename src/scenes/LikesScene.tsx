import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const LikesScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Likes"
      title="好きのカウントアップ"
      description="ハートが空中で集まり、ふたりの『好き』のやり取りをゲーム風に可視化します。"
      onAdvance={onAdvance}
      advanceLabel="Meetupsへ"
    >
      <ol className="scene-list">
        <li>ハートのSVGパーティクルをタップと連動して追加。</li>
        <li>クイズ『最初に好きって言ったのはどっち？』の演出を追加予定。</li>
        <li>Resultでバッジ演出と紐付け、統一トーンを保ちます。</li>
      </ol>
    </SceneLayout>
  )
}
