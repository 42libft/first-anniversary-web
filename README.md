# First Anniversary Web Experience

スマホ向けに設計した「ポップ × ロマンチック」な一周年記念インタラクティブ体験のフロントエンドです。ターミナル風の起動演出からはじまり、各セクションをメディアアート作品のように巡り、最後はApexリザルト画面のオマージュで締めくくります。

## 体験コンセプト
- **目的**: 1年間の思い出をゲーム的に追体験し、最後にふたりを讃える。
- **世界観**: 夜空・流星・空フェス夜市をモチーフにしたビジュアルと、ノベルゲームの文脈を融合。
- **トーン**: 「ポップ（ゲーム周年）」と「ロマンチック（記念日）」を 1:1 でミックス。
- **操作性**: スマホ縦画面／タップ進行。ノッチや safe area への対応を前提としたレイアウト。

## シーン構成
| Scene | 役割・演出の概要 |
| --- | --- |
| Intro | 夜空のASCIIアートとプログラム起動風演出。「Tap to start」でプロローグへ。 |
| Prologue | ノベルゲーム風の通話シーン。日付が一年前に戻ったという伏線を提示。 |
| Journeys | 東京⇄福岡の移動をSVGアニメで演出。写真・キャプション・質問入力・距離HUDをまとめるハブ。 |
| Messages | チャットバブルが増えていき合計メッセージ数を表示。距離データを活かしたクイズを挿入。 |
| Likes | ハートのパーティクル演出で「好き」の回数をカウントアップ。選択式クイズを予定。 |
| Meetups | 月ごとの思い出アルバム。各ページ固有のメディアアート背景に写真＋テキストをレイアウト。 |
| Letter | デジタル封筒から実物の手紙へ誘導。音・演出は最終仕上げで調整。 |
| Result | Apexリザルト画面をオマージュ。合計距離／メッセージ数／好き回数／会った日数／バッジを表示し、Introとループ。 |

## データとステート設計
- `journeys[]` は以下の構造で編集可能です。
  ```ts
  type Journey = {
    date: string
    from: string
    to: string
    transport: 'plane' | 'bus' | 'train'
    caption: string
    photoURL: string
    artKey: string
    distanceKm: number
    prompts: { q: string; answer?: string }[]
  }
  ```
- 合計距離は常時HUDに表示し、クイズやResultで再利用。
- `useStoredJourneyResponses` フックで自由回答をローカルストレージに保存し、`recordedAt`（ISO日時）付きで追跡。
- シーンの進行順は `src/types/scenes.ts` の `sceneOrder` で一元管理。`App` が現在シーンとナビゲーションロジックを保持します。

## 技術スタック
- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- スタイルはグローバルCSS（`src/App.css`, `src/index.css`）でモバイルファーストに設計。
- 将来的な演出強化のため、SVGアニメーションやローカルストレージ連携の土台を準備済み。

## 開発ワークフロー
1. 依存関係をインストール
   ```bash
   npm install
   ```
2. 開発サーバーを起動
   ```bash
   npm run dev
   ```
3. 型チェック付きビルド
   ```bash
   npm run build
   ```
4. ESLint による検証
   ```bash
   npm run lint
   ```

推奨: 変更前後で `npm run lint` を実行し、Safe Area 対応やモバイル表示をブラウザで確認してください。

## デプロイ（GitHub Pages）
- このリポジトリには GitHub Actions の Pages デプロイが含まれています。
- `main` ブランチに push すると自動でビルド・デプロイされます。
- Vite の `base` は Pages のプロジェクトURL `/first-anniversary-web/` に合わせて `build:pages` スクリプト内で指定しています。

手元でデプロイ挙動を確認（本番と同条件のビルド）
```bash
npm run build:pages
npx vite preview
```

Vercel / 任意ホストに出す場合は、`npm run build`（`base=/`）を使ってください。

## 実データの追加
- `src/data/journeys.ts` の各要素（`caption`, `photoURL`, `distanceKm` など）を実データに置き換えてください。
- 画像は `public/` 直下か外部URLのどちらでもOKです。

## ディレクトリ構成
```
src/
├── App.tsx              # シーン遷移とHUDを司るルートコンポーネント
├── components/          # HUDやシーン用レイアウトなど共通UI
├── data/journeys.ts     # Journeysセクションのベースデータ
├── hooks/               # ローカルストレージなど状態管理系フック
├── scenes/              # 各シーンの骨組みコンポーネント
└── types/               # Journey/シーン/回答データの型定義
```

補足ドキュメント
- 要件メモ: `docs/requirements.md`

## マイルストーン（改訂版）
1. **M1**: 環境構築＋骨組み（本コミット）
2. **M2**: Intro（夜空 × ターミナルASCII）
3. **M3**: Prologue（ノベル導入）
4. **M4**: Journeys（移動アニメ＋思い出表示＋距離カウント）
5. **M5**: Messages／Likes
6. **M6**: Meetups
7. **M7**: Letter／Result（Apex風）
8. **M8**: 演出仕上げ（サウンド含む最終調整）

このREADMEを最新の仕様メモとして随時アップデートし、進行管理に活用してください。
