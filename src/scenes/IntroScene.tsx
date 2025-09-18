import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const IntroScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Boot Sequence"
      title="FIRST ANNIVERSARY PROGRAM"
      description="Tap to launch the anniversary experience. 夜空のゲートウェイから、ふたりの一年が始まる。"
      onAdvance={onAdvance}
      advanceLabel="Tap to start"
    >
      <p className="scene-note">流星が走る夜空を背景に、プログラムの初期化演出を重ねる予定です。</p>
    </SceneLayout>
  )
}
