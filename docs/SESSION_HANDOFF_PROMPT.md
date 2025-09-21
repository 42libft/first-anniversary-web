# 次セッション向けハンドオフ・プロンプト

以下の最新仕様を前提に、未実装/改善タスクを継続してください。

## 現状スナップショット
- HUD（Total Distance）は Journeys セクションのみ表示。
- Intro/Prologue の星空・流れ星・月の背景は撤去済み。
- Journeys は「単一ビュー紙芝居」。move/episode/free/quiz のページを順送り（タップ進行）。
- Messages はフルブリードの Canvas メモリーストリーム。タップ位置から文字が曲線を流れ、端で反射・滞留。出現ごとにログ/カウント増。
- Likes はハート演出＋クイズ（QuizCardで保存/復元可能）で、今後強化予定。

## 優先TODO
1) Messages（アート/体験の深化）
   - public/data/messages-corpus.json を実データ（1行1要素）に差し替え、Canvas に供給。
   - 長押し/二本指など入力バリエーションで、文字列長・色相帯・曲線うねりをモードシフト。
   - 低負荷の背景ノイズレイヤ（流体風）を追加（Reduced Motionで抑止）。
   - カウンタ/ラベルをHUD風に再配置（小型・非侵襲）。

2) Journeys（将来のルート強化の土台）
   - moveステップへ routeId を付与できるフックを用意。
   - routeId → GeoJSON を `loadRouteGeoJson` 経由で読込み、JourneyMapへ反映（フォールバックは現行の抽象ルート/画像）。

3) Likes（味変）
   - Heartsの物理/色相を Messages と差別化。ミニクイズ複数化（QuizCard配列）と保存/復元。

4) Result（集計拡張）
   - Messages/Likes の最終値を表示カードに追加。
   - JSONエクスポート導線（ローカル保存の回答/集計の書き出し）。

## 実装ルール
- 既存のスタイル/命名に合わせ、変更範囲を最小に。
- 画像/コーパスは `public/` 配下に置く。localStorage鍵は衝突しない命名（`quiz:*` など）。
- パフォーマンス: DPRは上限2、粒子/文字数は端末負荷に応じて自動制御。

## 参考
- README（最新版仕様）
- src/scenes/MessagesScene.tsx（CanvasMemoryStreamの利用）
- src/components/CanvasMemoryStream.tsx（文字軌跡の中核）
- src/components/QuizCard.tsx / src/utils/quizStorage.ts

---
このハンドオフを受けたら、まず Messages のコーパス差替え → 文字ストリームのモードシフト（長押し/二本指）から着手してください。

