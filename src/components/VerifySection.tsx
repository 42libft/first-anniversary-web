import {
  useMemo,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Config } from '../types/config'

const buttonStyleLabels: Record<Config['verify']['button']['style'], string> = {
  primary: 'Primary (青)',
  secondary: 'Secondary (灰)',
  success: 'Success (緑)',
  danger: 'Danger (赤)',
}

interface VerifySectionProps {
  config: Config
  onUpdate: Dispatch<SetStateAction<Config>>
}

const useConfigMutator = (
  onUpdate: Dispatch<SetStateAction<Config>>
): ((mutator: (draft: Config) => void) => void) => {
  return (mutator) => {
    onUpdate((prev) => {
      const cloned: Config = structuredClone(prev)
      mutator(cloned)
      return cloned
    })
  }
}

export const VerifySection = ({ config, onUpdate }: VerifySectionProps) => {
  const mutate = useConfigMutator(onUpdate)

  const previewMessage = useMemo(() => {
    if (config.features.verify_mode === 'reaction') {
      return `${config.verify.acknowledgementMessage}\nリアクション: ${config.verify.reactionEmoji}`
    }

    return config.verify.acknowledgementMessage
  }, [
    config.features.verify_mode,
    config.verify.acknowledgementMessage,
    config.verify.reactionEmoji,
  ])

  const handleModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const mode = event.target.value as Config['features']['verify_mode']
    mutate((draft) => {
      draft.features.verify_mode = mode
    })
  }

  const handleButtonStyleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target
    mutate((draft) => {
      draft.verify.button.style = value as Config['verify']['button']['style']
    })
  }

  return (
    <div className="verify">
      <div className="form-grid">
        <label className="form-field">
          <span className="form-field__label">Verify パネルチャンネル</span>
          <input
            type="text"
            value={config.channels.verify_panel}
            onChange={(event) =>
              mutate((draft) => {
                draft.channels.verify_panel = event.target.value
              })
            }
            placeholder="#verify"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">認証付与ロール</span>
          <input
            type="text"
            value={config.roles.verified}
            onChange={(event) =>
              mutate((draft) => {
                draft.roles.verified = event.target.value
              })
            }
            placeholder="@Verified"
          />
        </label>
        <fieldset className="form-field form-field--column">
          <legend className="form-field__label">モード</legend>
          <label className="form-radio">
            <input
              type="radio"
              name="verify-mode"
              value="button"
              checked={config.features.verify_mode === 'button'}
              onChange={handleModeChange}
            />
            <span>ボタン</span>
          </label>
          <label className="form-radio">
            <input
              type="radio"
              name="verify-mode"
              value="reaction"
              checked={config.features.verify_mode === 'reaction'}
              onChange={handleModeChange}
            />
            <span>リアクション</span>
          </label>
        </fieldset>
        {config.features.verify_mode === 'button' ? (
          <>
            <label className="form-field">
              <span className="form-field__label">ボタンラベル</span>
              <input
                type="text"
                value={config.verify.button.label}
                onChange={(event) =>
                  mutate((draft) => {
                    draft.verify.button.label = event.target.value
                  })
                }
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">ボタンスタイル</span>
              <select
                value={config.verify.button.style}
                onChange={handleButtonStyleChange}
              >
                {Object.entries(buttonStyleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="form-field">
            <span className="form-field__label">リアクション絵文字</span>
            <input
              type="text"
              value={config.verify.reactionEmoji}
              onChange={(event) =>
                mutate((draft) => {
                  draft.verify.reactionEmoji = event.target.value
                })
              }
              placeholder="✅"
            />
          </label>
        )}
        <label className="form-field form-field--wide">
          <span className="form-field__label">案内メッセージ</span>
          <textarea
            rows={3}
            value={config.verify.acknowledgementMessage}
            onChange={(event) =>
              mutate((draft) => {
                draft.verify.acknowledgementMessage = event.target.value
              })
            }
          />
        </label>
        <label className="form-field form-field--wide">
          <span className="form-field__label">成功メッセージ</span>
          <input
            type="text"
            value={config.verify.button.successMessage}
            onChange={(event) =>
              mutate((draft) => {
                draft.verify.button.successMessage = event.target.value
              })
            }
          />
        </label>
        <label className="form-field form-field--wide">
          <span className="form-field__label">既に認証済みの文言</span>
          <input
            type="text"
            value={config.verify.button.alreadyVerifiedMessage}
            onChange={(event) =>
              mutate((draft) => {
                draft.verify.button.alreadyVerifiedMessage = event.target.value
              })
            }
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">Verify メッセージID（投稿後にBotが記録）</span>
          <input type="text" value={config.verify.messageId ?? ''} readOnly />
        </label>
      </div>

      <div className="verify__preview">
        <div className="discord-card">
          <div className="discord-card__header">
            <div className="discord-card__avatar" aria-hidden="true">⚙️</div>
            <div>
              <p className="discord-card__title">Verify</p>
              <p className="discord-card__subtitle">{previewMessage}</p>
            </div>
          </div>
          {config.features.verify_mode === 'button' ? (
            <div className="discord-card__actions">
              <button
                type="button"
                className={`discord-card__button discord-card__button--${config.verify.button.style}`}
              >
                {config.verify.button.label || 'Verify'}
              </button>
            </div>
          ) : (
            <div className="verify__reaction-preview">
              <span>リアクション: {config.verify.reactionEmoji || '✅'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
