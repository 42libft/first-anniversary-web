import { LetterExperience } from '../components/LetterExperience'
import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const LetterScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      hideHeader
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
