# AGENTS.md

## Purpose
このドキュメントは、リモート同期を怠ったことによるコンフリクトや挙動未反映を防ぎ、今後同様のトラブルを起こさないための作業ガイドです。

## Communication
エージェントからの返信は必ず日本語で行うこと。

## Workflow Guardrails
1. **作業開始前に最新化**
   - `git fetch origin`
   - `git merge origin/main`
   - `git status -sb` で `behind 0` を必ず確認。
2. **コミット前・push 前にも再度同期**
   - 直前にもう一度 `git fetch origin` → `git merge origin/main`。
   - `git status -sb` で `ahead N, behind 0` を確認できたら push。
3. **push が弾かれた場合の対応**
   - リベース禁止。必ず `git fetch origin` → `git merge origin/main` で同期し、衝突があれば報告してから解消。
4. **挙動確認の基本フロー**
   - `npm run build`
   - `git push origin main`
   - GitHub Actions 成功を確認
   - ブラウザをハードリロードして挙動確認。
5. **フェードなどアニメーション検証時の注意**
   - 単体タップで挙動を観察し、描画アニメーションが `opacity` を上書きしていないか確認する。
