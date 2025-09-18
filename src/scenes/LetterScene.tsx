import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const LetterScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Letter"
      title="封筒とメッセージ"
      description="デジタルの封筒をタップで開き、実物の手紙に誘導する静かなシーン。"
      onAdvance={onAdvance}
      advanceLabel="Resultへ"
    >
      <p className="scene-note">
        封筒の開閉アニメーションと柔らかな音の演出はM8で調整予定。それまではダミーで進めます。
      </p>
    </SceneLayout>
  )
}
