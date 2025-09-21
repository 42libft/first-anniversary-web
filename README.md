# Nyaimlab Bot 管理フロントエンド

Discord サーバー「Nyaimlab」で運用するカスタム Bot（Nyaimcat）の設定を GitHub Pages から編集・プレビューするためのフロントエンドです。Welcome Embed や Verify パネル、ロール配布UI、自己紹介モーダルなどの設定を一元管理し、生成された `config.yaml` を Pull Request として送信する運用を想定しています。

## 主な機能
- **ダッシュボード**: ギルドID、チャンネル割り当て、NGワード数など主要メトリクスを一覧表示。
- **オンボーディング設定**: Welcome Embed、ガイドラインDMテンプレート、Botを含む人数カウント切替、タイムゾーン調整をリアルタイムにプレビュー。
- **Verify 管理**: `/verify post` のモード切替（ボタン／リアクション）、ボタンスタイルや成功メッセージの編集、リアクション絵文字の確認。
- **ロール配布UI**: 選択／任意ロールの並び替え・追加・削除に対応。ボタン／セレクト形式双方に対応できるよう並び順を保つ設計。
- **自己紹介モーダル**: 項目の有効化／必須指定、プレースホルダー編集、セレクト項目の選択肢、文字数上限、NGワード、画像添付制限を管理。
- **スクリム補助（設計段階）**: 週次の参加確認フローや通知先チャンネルを先行定義し、将来の実装に備えます。
- **YAML 生成＆差分表示**: 現在の設定から `config.yaml` を生成し、baseline との diff を可視化。PR タイトル／本文のテンプレートも同画面で確認できます。

## 想定する運用フロー
1. GitHub Pages（またはローカル環境）で本フロントエンドを開く。
2. 既存の `config.yaml` を読み込み（現状は `defaultConfig` を baseline として内蔵）。
3. フォームで設定を調整し、カードで Discord 風プレビューを確認。
4. 「YAML差分 & PR」セクションで生成内容と差分をチェックし、必要なら `config.yaml` をコピー。
5. GitHub REST API を使って Draft PR を作成（将来的に PAT 入力モーダルを追加予定）。
6. PR マージ後、Bot 側のポーリングまたは Webhook で設定を再読込し、Discord に反映させる。

## セクション構成
| セクション | 目的 | 主な設定項目 |
| --- | --- | --- |
| ダッシュボード | 設定概要を俯瞰し、漏れをチェック | Guild ID、Verifyモード、ロール数、NGワード数、各チャンネル |
| オンボーディング | 入室時の Welcome Embed と DM | チャンネルID、Notion URL、人数カウント設定、DMテンプレート、プレビュー |
| Verify 設定 | 認証パネルの動作 | モード、ボタンラベル／スタイル、リアクション絵文字、成功メッセージ |
| ロール配布 | `/roles post` のUI構成 | selectable / optional ロールの追加・並び替え・削除、説明、絵文字 |
| 自己紹介モーダル | `/introduce` 入力項目 | 項目ON/OFF、必須指定、セレクト選択肢、文字数上限、画像添付制限、NGワード |
| スクリム補助 | 週次フローの下準備 | 参加確認日、通知先チャンネル、リマインド時刻、運用メモ |
| YAML差分 & PR | 出力・差分確認・PR下書き | 生成YAML、diff、PRタイトル／本文、手順ガイド |

## 開発環境の準備
```bash
npm install
npm run dev
```
開発サーバーは `http://localhost:5173` で起動します。Vite のホットリロードによりフォーム調整時も即座に反映されます。

型チェック付きビルドと Lint:
```bash
npm run build
npm run lint
```

GitHub Pages にデプロイする場合は `npm run build:pages` を利用し、`vite.config.ts` の `base` 設定が `/first-anniversary-web/` になる点に注意してください。

## `config.yaml` の構造
生成される YAML は以下の構造を前提としています（抜粋）。
```yaml
guild:
  id: "123456789012345678"
channels:
  welcome: "#welcome"
  verify_panel: "#verify-panel"
  roles_panel: "#roles"
  introductions: "#自己紹介"
  audit_log: "#audit-log"
  fallback_notice: "#welcome"
features:
  count_bots_in_member_count: false
  verify_mode: "button"
messaging:
  welcomeDmTemplate: "ようこそ Nyaimlab へ！\n1. ガイド：{notionUrl}..."
  fallbackThreadMessage: "DMが送れませんでした..."
roles:
  verified: "@Verified"
  selectable:
    - id: "apex"
      label: "Apex"
      role: "@Apex"
introductions:
  fields:
    - id: "name"
      label: "名前"
      type: "short"
      required: true
      enabled: true
  maxCharacters:
    name: 32
verify:
  button:
    label: "Verify"
    style: "success"
  reactionEmoji: "✅"
locales:
  timezone: "Asia/Tokyo"
scrim:
  enabled: false
  pollDay: "sunday"
```
`defaultConfig` が baseline として `src/data/defaultConfig.ts` に定義されており、今後は GitHub API から最新の `config.yaml` を取得する処理を追加予定です。

## 今後の拡張予定
- GitHub PAT を入力してリポジトリの `config.yaml` を直接取得／更新する連携モジュール。
- Audit Log の可視化タブ（Discord JSON ログ or GitHub Issues から取得）。
- スクリム補助フローの実装（Firestore / Google Sheets 連携を想定）。
- i18n 対応（日本語／英語切替）とアクセシビリティ改善。

## ディレクトリ構成
```text
src/
├── App.tsx                 # ルートコンポーネントとセクション構成
├── App.css                 # 全体レイアウト・フォームスタイル
├── components/             # セクションごとのUIコンポーネント
├── data/defaultConfig.ts   # baselineとなる設定オブジェクト
├── types/config.ts         # Config型定義
└── utils/                  # YAMLシリアライズと差分生成
```

## ライセンス
社内利用向けプロジェクトのためライセンスは未指定です。必要に応じて組織のルールに従ってください。
