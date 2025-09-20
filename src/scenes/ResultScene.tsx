import { SceneLayout } from '../components/SceneLayout'
import type { SceneComponentProps } from '../types/scenes'

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(value)

export const ResultScene = ({
  onRestart,
  journeys,
  distanceTraveled,
  responses,
}: SceneComponentProps) => {
  const recordedResponses = responses.length

  return (
    <SceneLayout
      eyebrow="Result"
      title="Apexリザルト風サマリー"
      description="合計距離・メッセージ数・好きのカウント・会った日数を讃える最終画面。ここから伏線を回収してエンディングへ。"
      onAdvance={onRestart}
      advanceLabel="もう一度再生"
    >
      <div className="result-grid">
        <div className="result-card">
          <p className="result-label">TRAVELLED</p>
          <p className="result-value">{formatNumber(Math.round(distanceTraveled))} km</p>
        </div>
        <div className="result-card">
          <p className="result-label">JOURNEYS</p>
          <p className="result-value">{formatNumber(journeys.length)}</p>
        </div>
        <div className="result-card">
          <p className="result-label">RESPONSES LOGGED</p>
          <p className="result-value">{formatNumber(recordedResponses)}</p>
        </div>
        <div className="result-card">
          <p className="result-label">BADGES PREVIEW</p>
          <p className="result-value">Angel 1004 / Wave Walker</p>
        </div>
      </div>
      <p className="scene-note">
        本実装ではここにスクリーンショット映えするApex風レイアウトとバッジ演出を追加し、Introのターミナル演出とループさせます。
      </p>
    </SceneLayout>
  )
}
