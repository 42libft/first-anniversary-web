import { LetterExperience } from '../components/LetterExperience'
import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const LetterScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Letter"
      title="パックとメッセージ"
      description="ポケポケのトレーディングカード開封をオマージュし、長押しから横方向の破り操作でスキャンした手紙へ誘うシーン。"
      onAdvance={onAdvance}
      advanceLabel="Resultへ"
    >
      <LetterExperience />
      <p className="scene-note">
        手紙のスキャン画像は最終稿で差し替え予定。現在はダミーのレターペーパーで演出のみ確認できます。
      </p>
    </SceneLayout>
  )
}
