import { useMemo, useState } from 'react'
import type { Config } from '../types/config'
import type { DiffLine } from '../utils/diff'

interface YamlPreviewSectionProps {
  config: Config
  yaml: string
  baselineYaml: string
  diff: DiffLine[]
}

const hasChanges = (diff: DiffLine[]) => diff.some((line) => line.kind !== 'context')

export const YamlPreviewSection = ({
  config,
  yaml,
  baselineYaml,
  diff,
}: YamlPreviewSectionProps) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [prTitle, setPrTitle] = useState('chore(config): update nyaimlab settings')
  const [prBody, setPrBody] = useState(
    ['## Summary', '- update onboarding flows and verify panel', '- adjust roles / introductions settings', '', '## Testing', '- not run (config only)'].join(
      '\n'
    )
  )

  const diffHasChanges = useMemo(() => hasChanges(diff), [diff])

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch (error) {
      console.error(error)
      setCopyState('error')
    }
  }

  const resolvedBody = useMemo(() => {
    return prBody
      .replaceAll('{guildId}', config.guild.id)
      .replaceAll('{verifyMode}', config.features.verify_mode)
  }, [prBody, config.guild.id, config.features.verify_mode])

  return (
    <div className="yaml-preview">
      <div className="yaml-preview__controls">
        <button type="button" onClick={copyYaml}>
          YAMLをコピー
        </button>
        <span className={`yaml-preview__copy-state yaml-preview__copy-state--${copyState}`}>
          {copyState === 'copied'
            ? 'コピーしました'
            : copyState === 'error'
              ? 'コピーに失敗しました'
              : ''}
        </span>
      </div>

      <div className="yaml-preview__panes">
        <section className="card">
          <h3>生成された config.yaml</h3>
          <pre className="yaml-preview__code" aria-label="生成された設定">
            {yaml}
          </pre>
        </section>
        <section className="card">
          <h3>差分</h3>
          {diffHasChanges ? (
            <pre className="diff-view" aria-label="差分">
              {diff.map((line, index) => (
                <span key={`${line.kind}-${index}`} className={`diff-view__line diff-view__line--${line.kind}`}>
                  {line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}
                  {line.value}
                </span>
              ))}
            </pre>
          ) : (
            <p className="section__hint">差分はありません（baselineと同一）。</p>
          )}
        </section>
      </div>

      <section className="card yaml-preview__pr">
        <h3>PR 下書き</h3>
        <label className="form-field">
          <span className="form-field__label">タイトル</span>
          <input
            type="text"
            value={prTitle}
            onChange={(event) => setPrTitle(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">本文テンプレート</span>
          <textarea
            rows={6}
            value={prBody}
            onChange={(event) => setPrBody(event.target.value)}
          />
        </label>
        <div className="yaml-preview__summary">
          <h4>整形済みプレビュー</h4>
          <pre>{resolvedBody}</pre>
        </div>
        <div className="yaml-preview__instructions">
          <p>
            1. GitHub Personal Access Token（スコープ: <code>repo</code>）を用意し、フロントエンドの「GitHub接続」モーダルで入力します。
          </p>
          <p>2. 「PRを作成」ボタンで <code>main</code> ブランチ向けに Draft PR を作成します。</p>
          <p>3. Bot 側ではマージ後60秒以内のポーリングで設定を再読み込みします。</p>
          <p>4. 生成された差分を確認し、監査ログチャンネルに反映されることを確認してください。</p>
        </div>
        <p className="section__hint">
          baseline と同一の場合は PR 作成は不要です。必要に応じて <code>config.yaml</code> を直接更新した後に再読み込みしてください。
        </p>
      </section>

      <section className="card yaml-preview__baseline">
        <h3>Baseline (読み込んだ設定)</h3>
        <pre className="yaml-preview__code" aria-label="baseline設定">
          {baselineYaml}
        </pre>
      </section>
    </div>
  )
}
