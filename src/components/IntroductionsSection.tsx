import {
  useMemo,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import type { Config, IntroductionField } from '../types/config'

interface IntroductionsSectionProps {
  config: Config
  onUpdate: Dispatch<SetStateAction<Config>>
}

const findField = (fields: IntroductionField[], id: IntroductionField['id']) =>
  fields.find((field) => field.id === id)

export const IntroductionsSection = ({ config, onUpdate }: IntroductionsSectionProps) => {
  const mutate = (mutator: (draft: Config) => void) => {
    onUpdate((prev) => {
      const cloned: Config = structuredClone(prev)
      mutator(cloned)
      return cloned
    })
  }

  const [ngWordInput, setNgWordInput] = useState('')

  const enabledFields = useMemo(
    () => config.introductions.fields.filter((field) => field.enabled),
    [config.introductions.fields]
  )

  const handleFieldToggle = (
    id: IntroductionField['id'],
    key: 'enabled' | 'required',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { checked } = event.target
    mutate((draft) => {
      const field = findField(draft.introductions.fields, id)
      if (field) {
        field[key] = checked
      }
    })
  }

  const handleFieldPlaceholderChange = (
    id: IntroductionField['id'],
    value: string
  ) => {
    mutate((draft) => {
      const field = findField(draft.introductions.fields, id)
      if (field) {
        field.placeholder = value
      }
    })
  }

  const handleOptionsChange = (
    id: IntroductionField['id'],
    value: string
  ) => {
    const options = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    mutate((draft) => {
      const field = findField(draft.introductions.fields, id)
      if (field) {
        field.options = options
      }
    })
  }

  const handleLimitChange = (
    key: keyof Config['introductions']['maxCharacters'],
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue = Number(event.target.value)
    mutate((draft) => {
      draft.introductions.maxCharacters[key] = Number.isNaN(nextValue)
        ? draft.introductions.maxCharacters[key]
        : Math.max(1, nextValue)
    })
  }

  const handleImageToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target
    mutate((draft) => {
      draft.introductions.imageAttachment.allow = checked
    })
  }

  const handleImageSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value)
    mutate((draft) => {
      draft.introductions.imageAttachment.maxSizeMb = Number.isNaN(nextValue)
        ? draft.introductions.imageAttachment.maxSizeMb
        : Math.max(1, nextValue)
    })
  }

  const handleNgWordAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const word = ngWordInput.trim()
    if (!word) {
      return
    }
    mutate((draft) => {
      if (!draft.introductions.ngWords.includes(word)) {
        draft.introductions.ngWords.push(word)
      }
    })
    setNgWordInput('')
  }

  const removeNgWord = (index: number) => {
    mutate((draft) => {
      draft.introductions.ngWords.splice(index, 1)
    })
  }

  const selectFieldOptions = config.introductions.fields.filter(
    (field) => field.type === 'select'
  )

  return (
    <div className="introductions">
      <div className="introductions__fields">
        {config.introductions.fields.map((field) => (
          <article key={field.id} className="introduction-field">
            <header className="introduction-field__header">
              <div>
                <h3>{field.label}</h3>
                <p className="introduction-field__meta">
                  ID: <code>{field.id}</code> / タイプ: {field.type}
                </p>
              </div>
              <div className="introduction-field__toggles">
                <label className="form-field form-field--checkbox">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(event) => handleFieldToggle(field.id, 'enabled', event)}
                  />
                  <span>使用する</span>
                </label>
                <label className="form-field form-field--checkbox">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => handleFieldToggle(field.id, 'required', event)}
                  />
                  <span>必須</span>
                </label>
              </div>
            </header>
            <div className="introduction-field__body">
              {field.type === 'select' ? (
                <label className="form-field">
                  <span className="form-field__label">選択肢（改行区切り）</span>
                  <textarea
                    rows={3}
                    value={(field.options ?? []).join('\n')}
                    onChange={(event) => handleOptionsChange(field.id, event.target.value)}
                  />
                </label>
              ) : (
                <label className="form-field">
                  <span className="form-field__label">プレースホルダー</span>
                  <input
                    type="text"
                    value={field.placeholder ?? ''}
                    onChange={(event) => handleFieldPlaceholderChange(field.id, event.target.value)}
                  />
                </label>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="introductions__aside">
        <section className="card">
          <h3>文字数制限</h3>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-field__label">名前</span>
              <input
                type="number"
                min={1}
                value={config.introductions.maxCharacters.name}
                onChange={(event) => handleLimitChange('name', event)}
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">一言コメント</span>
              <input
                type="number"
                min={1}
                value={config.introductions.maxCharacters.comment}
                onChange={(event) => handleLimitChange('comment', event)}
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">好きな食べ物</span>
              <input
                type="number"
                min={1}
                value={config.introductions.maxCharacters.favoriteFood}
                onChange={(event) => handleLimitChange('favoriteFood', event)}
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">ゲーム情報</span>
              <input
                type="number"
                min={1}
                value={config.introductions.maxCharacters.games}
                onChange={(event) => handleLimitChange('games', event)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h3>画像添付</h3>
          <label className="form-field form-field--checkbox">
            <input
              type="checkbox"
              checked={config.introductions.imageAttachment.allow}
              onChange={handleImageToggle}
            />
            <span>自己紹介に画像を添付できるようにする</span>
          </label>
          <label className="form-field">
            <span className="form-field__label">最大サイズ (MB)</span>
            <input
              type="number"
              min={1}
              value={config.introductions.imageAttachment.maxSizeMb}
              onChange={handleImageSizeChange}
            />
          </label>
        </section>

        <section className="card">
          <h3>NGワード</h3>
          <form className="ng-form" onSubmit={handleNgWordAdd}>
            <input
              type="text"
              value={ngWordInput}
              onChange={(event) => setNgWordInput(event.target.value)}
              placeholder="NGワードを入力"
            />
            <button type="submit">追加</button>
          </form>
          <ul className="ng-list">
            {config.introductions.ngWords.map((word, index) => (
              <li key={word}>
                <span>{word}</span>
                <button type="button" onClick={() => removeNgWord(index)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card introductions__preview">
          <h3>Embed プレビュー</h3>
          <div className="discord-card discord-card--compact">
            <div className="discord-card__header">
              <div className="discord-card__avatar" aria-hidden="true">
                📝
              </div>
              <div>
                <p className="discord-card__title">自己紹介</p>
                <p className="discord-card__subtitle">{enabledFields.length} 項目</p>
              </div>
            </div>
            <div className="discord-card__body">
              {enabledFields.slice(0, 4).map((field) => (
                <p key={field.id} className="discord-card__field">
                  <span>{field.label}</span>
                  <span>{field.required ? '必須' : '任意'}</span>
                </p>
              ))}
              {enabledFields.length > 4 ? (
                <p className="discord-card__hint">他 {enabledFields.length - 4} 項目...</p>
              ) : null}
            </div>
          </div>
          {selectFieldOptions.length ? (
            <p className="section__hint">
              セレクトフィールドには {selectFieldOptions.map((field) => field.label).join(' / ')} が含まれます。
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
