import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Config, RoleOption } from '../types/config'

interface RolesSectionProps {
  config: Config
  onUpdate: Dispatch<SetStateAction<Config>>
}

type RoleGroupKey = 'selectable' | 'optional'

const roleGroupLabels: Record<RoleGroupKey, string> = {
  selectable: '選択ロール（複数可）',
  optional: '任意ロール',
}

const createEmptyRole = (): RoleOption => ({
  id: `role-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  role: '',
  description: '',
  emoji: '',
})

export const RolesSection = ({ config, onUpdate }: RolesSectionProps) => {
  const mutate = (mutator: (draft: Config) => void) => {
    onUpdate((prev) => {
      const cloned: Config = structuredClone(prev)
      mutator(cloned)
      return cloned
    })
  }

  const handleRoleChange = (
    group: RoleGroupKey,
    index: number,
    field: keyof RoleOption,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target
    mutate((draft) => {
      draft.roles[group][index] = {
        ...draft.roles[group][index],
        [field]: value,
      }
    })
  }

  const addRole = (group: RoleGroupKey) => {
    mutate((draft) => {
      draft.roles[group].push(createEmptyRole())
    })
  }

  const removeRole = (group: RoleGroupKey, index: number) => {
    mutate((draft) => {
      draft.roles[group].splice(index, 1)
    })
  }

  const moveRole = (group: RoleGroupKey, index: number, direction: -1 | 1) => {
    mutate((draft) => {
      const list = draft.roles[group]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= list.length) {
        return
      }
      const [item] = list.splice(index, 1)
      list.splice(targetIndex, 0, item)
    })
  }

  const renderRoleGroup = (group: RoleGroupKey) => (
    <div className="role-group" key={group}>
      <div className="role-group__header">
        <h3>{roleGroupLabels[group]}</h3>
        <button type="button" onClick={() => addRole(group)}>
          + 追加
        </button>
      </div>
      <div className="role-group__list">
        {config.roles[group].map((role, index) => (
          <article className="role-card" key={role.id}>
            <div className="role-card__header">
              <span className="role-card__index">#{index + 1}</span>
              <div className="role-card__actions">
                <button
                  type="button"
                  onClick={() => moveRole(group, index, -1)}
                  disabled={index === 0}
                  aria-label="上に移動"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveRole(group, index, 1)}
                  disabled={index === config.roles[group].length - 1}
                  aria-label="下に移動"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeRole(group, index)}
                  aria-label="削除"
                >
                  削除
                </button>
              </div>
            </div>
            <div className="role-card__body">
              <label className="form-field">
                <span className="form-field__label">ID</span>
                <input
                  type="text"
                  value={role.id}
                  onChange={(event) => handleRoleChange(group, index, 'id', event)}
                />
              </label>
              <label className="form-field">
                <span className="form-field__label">ラベル</span>
                <input
                  type="text"
                  value={role.label}
                  onChange={(event) => handleRoleChange(group, index, 'label', event)}
                />
              </label>
              <label className="form-field">
                <span className="form-field__label">Discord ロール</span>
                <input
                  type="text"
                  value={role.role}
                  onChange={(event) => handleRoleChange(group, index, 'role', event)}
                  placeholder="@Role"
                />
              </label>
              <label className="form-field">
                <span className="form-field__label">説明</span>
                <textarea
                  rows={2}
                  value={role.description ?? ''}
                  onChange={(event) => handleRoleChange(group, index, 'description', event)}
                />
              </label>
              <label className="form-field">
                <span className="form-field__label">絵文字</span>
                <input
                  type="text"
                  value={role.emoji ?? ''}
                  onChange={(event) => handleRoleChange(group, index, 'emoji', event)}
                  placeholder="🎮"
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </div>
  )

  return (
    <div className="roles">
      <p className="section__hint">
        ボタンモードでは Action Row あたり最大5件です。順番は上からボタンの並び順、セレクトモードでは表示順になります。
      </p>
      <div className="roles__grid">
        {renderRoleGroup('selectable')}
        {renderRoleGroup('optional')}
      </div>
    </div>
  )
}
