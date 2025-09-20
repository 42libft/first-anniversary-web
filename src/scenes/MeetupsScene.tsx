import { MeetupGallery } from '../components/MeetupGallery'
import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const MeetupsScene = ({ onAdvance, meetups }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Meetups"
      title="月ごとのアルバム"
      description="月替わりのメディアアート背景に、縦横の写真とハイライトメモを重ねる展示会スタイルのギャラリー。"
      onAdvance={onAdvance}
      advanceLabel="Letterへ"
    >
      <MeetupGallery meetups={meetups} />
      <p className="scene-note">
        最終版では各月の自由回答をこのカードに差し込む予定。グラデーション背景はデータから生成できるように設計し、
        モバイルでもスワイプ操作で切り替えられるよう整えました。
      </p>
    </SceneLayout>
  )
}
