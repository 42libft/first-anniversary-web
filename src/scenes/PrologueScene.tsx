import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const PrologueScene = ({ onAdvance }: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Prologue"
      title="ノベル導入（通話編）"
      description="ゲーム内通話から不思議な出来事が始まり、『日付はちょうど一年前』という伏線をここで張ります。"
      onAdvance={onAdvance}
      advanceLabel="通話を続ける"
    >
      <ul className="scene-list">
        <li>ノベルゲーム風のUIでセリフが1行ずつフェードイン。</li>
        <li>タップで進行。背景は淡い夜空と通話UIの組み合わせ。</li>
        <li>最後に『時間が巻き戻っている』ことに気付くセリフでJourneysへ遷移。</li>
      </ul>
    </SceneLayout>
  )
}
