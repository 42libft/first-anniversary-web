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
| Intro | ターミナル風ブート → START 画面へ。シンプルな開始導線に整理（星空は未適用）。 |
| Prologue | ノベルゲーム風の通話導入。背景演出は独立管理（星空は未適用）。 |
| Journeys | 紙芝居（単一ビュー順送り）。移動/思い出/自由記述/クイズをページ化。距離HUDはここだけ表示。 |
| Messages | キャンバス上で「文字のメモリーストリーム」を全画面に描画（フルブリード）。タップ位置から文字が曲線を流れ、端で反射・滞留。 |
| Likes | ハートの演出＋カウント。水面のリングがタップ位置から広がり、総数がアナウンスされる。 |
| Links | 共有したリンク数をネットワークのリップルで可視化。タップで光の波が広がり総数をカウント。 |
| Media | やり取りした写真・動画数をオーロラ状の光で表現。タップでフレームの残光が広がる。 |
| Letter | デジタル封筒から実物の手紙へ誘導。音・演出は最終仕上げで調整。 |
| Result | Apexリザルト画面をオマージュ。合計距離／メッセージ数／好き回数／会った日数／バッジを表示し、Introとループ。 |

## データとステート設計
- `journeys[]` は以下のステップ指向モデルに統一しました。`distanceKm` は move ステップの合計値です。
  ```ts
  type JourneyStep =
    | {
        id: string
        type: 'move'
        from: string
        to: string
        transport: 'plane' | 'bus' | 'train'
        distanceKm: number
        artKey: string
        description?: string
      }
    | {
        id: string
        type: 'episode'
        title: string
        caption: string
        artKey: string
        media: { src: string; alt: string; objectPosition?: string }
      }
    | {
        id: string
        type: 'question'
        prompt: string
        placeholder?: string
        helper?: string
      }

  type Journey = {
    id: string
    title: string
    date: string
    distanceKm: number
    steps: JourneyStep[]
  }
- move ステップ完了時に距離HUDへ累計を反映（HUDは Journeys のみ表示）。Reduced Motion 環境ではアニメをスキップしつつ距離だけ即時更新します。
- question ステップの回答は `useStoredJourneyResponses` が localStorage を正とします（保存後はロック可）。
- Links の総数は `src/data/links.ts` に集約。Discord で共有したリンクの方向別カウントを保持します。
- Media の総数は `src/data/media.ts` で管理。送受信した写真・動画の枚数を記録します。
- シーンの進行順は `src/types/scenes.ts` の `sceneOrder` で一元管理。`App` が現在シーンとナビゲーションロジックを保持します。

## 技術スタック
- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + TypeScript
- スタイルはグローバルCSS（`src/App.css`, `src/index.css`）でモバイルファーストに設計。
- SVG（Journeys）、Canvas（Messages）のハイブリッド構成。localStorage を横断利用。

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

## メンテナンス用ナビゲーションの有効化
- 本番環境でシーンを直接行き来するメンテナンス用ナビゲーションを有効にするには、URL の末尾に `?maintenanceNav=1` を付与してください。
- クエリパラメータが存在するだけで有効になるため、`?maintenanceNav` でも同様に動作します。

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
- `src/data/journeys.ts` の各ステップ（move / episode / question）を実データに差し替えてください。`distanceKm` は move ステップごとに設定し、合計が旅の距離になります。
- `src/data/meetups.ts` で月ごとのアルバムページを編集できます。`background` はCSSグラデーション文字列、`memoryPoints` は箇条書きメモです。
- 画像は `public/` 直下か外部URLのどちらでもOKです。
- Messages のテキストコーパスは `public/data/messages-corpus.json`（1行1メッセージ推奨）に配置可能。未設定時はダミー文／ハイライト文を使用。

## ディレクトリ構成
```
src/
├── App.tsx              # シーン遷移とHUDを司るルートコンポーネント
├── components/          # HUDやシーン用レイアウトなど共通UI
├── data/journeys.ts     # Journeysセクションのベースデータ
├── data/links.ts        # Linksセクションのリンク交換カウント
├── data/media.ts        # Mediaセクションのメディア交換カウント
├── hooks/               # ローカルストレージなど状態管理系フック
├── scenes/              # 各シーンの骨組みコンポーネント
└── types/               # Journey/シーン/回答データの型定義
```

補足ドキュメント
- 要件メモ: `docs/requirements.md`
- 進行メモ（最新）: `docs/discussions/2025-09-18-alignment.md`

## 主要変更ファイル（ダイジェスト）
- `src/data/journeys.ts`: Journeys データを move / episode / question ステップ構造に刷新。
- `src/scenes/JourneysScene.tsx`: ステップ進行・距離HUD連動・回答の閲覧/編集トグルを統合。
- `src/data/links.ts`: Discord のリンク共有カウントを定義。
- `src/data/media.ts`: 写真・動画の送受信カウントを定義。
- `src/scenes/LinksScene.tsx`: リンク用の水面リップル演出とカウント表示。
- `src/scenes/MediaScene.tsx`: メディア用のオーロラ演出とカウント表示。
- `src/App.css`: 各シーンのメディアアート／HUD スタイルを管理。

## 衝突回避ガイド
- Journeys の move ステップIDは `distanceTraveled` 計算のキーになるため削除せず、編集時はIDを据え置いてください。
- question ステップの `prompt` を変更する際は同じIDを使いつつ文言だけ差し替えると、保存済み回答が維持されます。
- Links/Media 向けの背景は CSS グラデーションで構成されています。色味を変更する際は各セクションの `::before`/`::after` を調整してください。
- `DistanceHUD` は Journeys のみ表示。レイアウト変更時も他シーンには出ません。

## 簡易E2Eチェック手順
1. `npm run build` で型チェック付きビルドが通ることを確認。
2. `npm run dev` を起動し、以下の流れを手動で辿る。
   - Intro: BOOT → START をタップで進行（星空なし）。
   - Prologue: ノベルを最後まで進めて Journeys へ（星空なし）。
   - Journeys: 紙芝居で各ページをタップ進行。moveでHUD加算、questionで保存/ロック。
   - Messages: 画面タップで文字ストリームが出現し、端で反射・滞留すること。ログとカウントが増えること。
   - Likes: ハートの水面演出をタップで体験し、カウントが最大になることを確認。
   - Links: タップでネットワークリップルが発生し、合計リンク数が増えることを確認。
   - Media: タップでオーロラ状の光が広がり、合計メディア数が表示されることを確認。
   - Result: サマリーに遷移し、`もう一度再生` でIntroへループ。
3. ブラウザの DevTools で `prefers-reduced-motion` を有効にし、Journeys の move ステップが瞬時に完了して距離が加算されることを確認。

## マイルストーン（改訂版）
1. **M1**: 環境構築＋骨組み（本コミット）
2. **M2**: Intro（夜空 × ターミナルASCII）
3. **M3**: Prologue（ノベル導入）
4. **M4**: Journeys（移動アニメ＋思い出表示＋距離カウント）
5. **M5**: Messages／Likes
6. **M6**: Links / Media（Discord交換記録の演出）
7. **M7**: Letter／Result（Apex風）
8. **M8**: 演出仕上げ（サウンド含む最終調整）

このREADMEを最新の仕様メモとして随時アップデートし、進行管理に活用してください。
