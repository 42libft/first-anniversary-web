import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { Config } from '../types/config'

type ConfigUpdater = Dispatch<SetStateAction<Config>>

interface WelcomeSectionProps {
  config: Config
  onUpdate: ConfigUpdater
}

const replacePlaceholders = (template: string, config: Config): string => {
  const channelName = config.channels.roles_panel.replace(/^#/, '')
  return template
    .replaceAll('{notionUrl}', config.notion.guidelines_url || '{notionUrl}')
    .replaceAll('{roles_panel}', channelName || '{roles_panel}')
    .replaceAll('#{roles_panel}', channelName ? `#${channelName}` : '#{roles_panel}')
}

export const WelcomeSection = ({ config, onUpdate }: WelcomeSectionProps) => {
  const [previewName, setPreviewName] = useState('Nyaimcat')
  const [previewIndex, setPreviewIndex] = useState(128)

  const mutate = (mutator: (draft: Config) => void) => {
    onUpdate((prev) => {
      const updated: Config = structuredClone(prev)
      mutator(updated)
      return updated
    })
  }

  const joinDatePreview = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: config.locales.timezone || 'Asia/Tokyo',
    })
    return formatter.format(new Date('2025-02-22T12:34:00+09:00'))
  }, [config.locales.timezone])

  const resolvedDm = useMemo(
    () => replacePlaceholders(config.messaging.welcomeDmTemplate, config),
    [config]
  )

  return (
    <div className="welcome">
      <div className="form-grid">
        <label className="form-field">
          <span className="form-field__label">Guild ID</span>
          <input
            type="text"
            value={config.guild.id}
            onChange={(event) =>
              mutate((draft) => {
                draft.guild.id = event.target.value
              })
            }
            placeholder="123456789012345678"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">Welcome チャンネル</span>
          <input
            type="text"
            value={config.channels.welcome}
            onChange={(event) =>
              mutate((draft) => {
                draft.channels.welcome = event.target.value
              })
            }
            placeholder="#welcome"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">ロール配布チャンネル</span>
          <input
            type="text"
            value={config.channels.roles_panel}
            onChange={(event) =>
              mutate((draft) => {
                draft.channels.roles_panel = event.target.value
              })
            }
            placeholder="#roles"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">DM代替案内スレッド先</span>
          <input
            type="text"
            value={config.channels.fallback_notice}
            onChange={(event) =>
              mutate((draft) => {
                draft.channels.fallback_notice = event.target.value
              })
            }
            placeholder="#welcome"
          />
        </label>
        <label className="form-field form-field--wide">
          <span className="form-field__label">Notion ガイドURL</span>
          <input
            type="url"
            value={config.notion.guidelines_url}
            onChange={(event) =>
              mutate((draft) => {
                draft.notion.guidelines_url = event.target.value
              })
            }
            placeholder="https://www.notion.so/..."
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">タイムゾーン</span>
          <input
            type="text"
            value={config.locales.timezone}
            onChange={(event) =>
              mutate((draft) => {
                draft.locales.timezone = event.target.value
              })
            }
            placeholder="Asia/Tokyo"
          />
        </label>
        <label className="form-field form-field--checkbox">
          <input
            type="checkbox"
            checked={config.features.count_bots_in_member_count}
            onChange={(event) =>
              mutate((draft) => {
                draft.features.count_bots_in_member_count = event.target.checked
              })
            }
          />
          <span>メンバー人数にBotを含める</span>
        </label>
      </div>

      <div className="form-area">
        <label className="form-field">
          <span className="form-field__label">Welcome DM テンプレート</span>
          <textarea
            rows={5}
            value={config.messaging.welcomeDmTemplate}
            onChange={(event) =>
              mutate((draft) => {
                draft.messaging.welcomeDmTemplate = event.target.value
              })
            }
          />
          <p className="form-field__hint">
            プレースホルダー <code>{'{notionUrl}'}</code> と <code>{'{roles_panel}'}</code> が利用できます。
          </p>
        </label>
      </div>

      <div className="form-area">
        <label className="form-field">
          <span className="form-field__label">DM 送信失敗時の案内</span>
          <textarea
            rows={3}
            value={config.messaging.fallbackThreadMessage}
            onChange={(event) =>
              mutate((draft) => {
                draft.messaging.fallbackThreadMessage = event.target.value
              })
            }
          />
        </label>
      </div>

      <div className="welcome__preview">
        <div className="welcome__controls">
          <label className="form-field">
            <span className="form-field__label">プレビュー用ユーザー名</span>
            <input
              type="text"
              value={previewName}
              onChange={(event) => setPreviewName(event.target.value)}
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">メンバー番号</span>
            <input
              type="number"
              value={previewIndex}
              min={1}
              onChange={(event) => setPreviewIndex(Number(event.target.value) || 1)}
            />
          </label>
        </div>
        <div className="discord-card">
          <div className="discord-card__header">
            <div className="discord-card__avatar" aria-hidden="true">
              {previewName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="discord-card__title">ようこそ、{previewName} さん！</p>
              <p className="discord-card__subtitle">
                あなたは <strong>#{previewIndex}</strong> 人目のメンバーです。
              </p>
            </div>
          </div>
          <div className="discord-card__body">
            <p className="discord-card__field">
              <span>加入日時 (JST)</span>
              <span>{joinDatePreview}</span>
            </p>
          </div>
          <div className="discord-card__footer">Nyaimlab</div>
          <div className="discord-card__actions">
            <a
              className="discord-card__button discord-card__button--link"
              href={config.notion.guidelines_url || '#'}
            >
              ガイドを見る
            </a>
            <button type="button" className="discord-card__button">
              ロールを選ぶ
            </button>
          </div>
        </div>
        <div className="welcome__dm-preview">
          <h4>DM プレビュー</h4>
          <pre>{resolvedDm}</pre>
        </div>
      </div>
    </div>
  )
}
