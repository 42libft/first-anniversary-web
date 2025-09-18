import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

export const JourneysScene = ({
  onAdvance,
  journeys,
  totalDistance,
}: SceneComponentProps) => {
  return (
    <SceneLayout
      eyebrow="Journeys"
      title="移動演出と思い出ギャラリー"
      description="東京⇄福岡の移動をSVGアニメで描写しつつ、写真とキャプション、質問入力を組み合わせるハブシーンです。"
      onAdvance={onAdvance}
      advanceLabel="次のシーンへ"
    >
      <div className="stat-grid">
        <div>
          <p className="stat-label">登録予定の移動イベント</p>
          <p className="stat-value">{journeys.length}件</p>
        </div>
        <div>
          <p className="stat-label">サンプル合計距離</p>
          <p className="stat-value">{Math.round(totalDistance)} km</p>
        </div>
      </div>
      <p className="scene-note">
        タップで進むたびに飛行機アイコンをアニメーションさせ、到着時に写真＋質問カードがスライド表示される構成を想定しています。
      </p>
      <ol className="scene-list">
        <li>距離HUDは画面上部に固定し、シーン移動間でも値を共有。</li>
        <li>回答はローカルストレージに保存し、Resultで固定表示。</li>
        <li>クイズ用に距離ステートを他シーンから参照できるよう設計。</li>
      </ol>
    </SceneLayout>
  )
}
