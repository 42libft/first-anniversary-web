import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Config } from '../types/config'

const weekdayLabels: Record<Config['scrim']['pollDay'], string> = {
  sunday: '日曜日',
  monday: '月曜日',
  tuesday: '火曜日',
  wednesday: '水曜日',
  thursday: '木曜日',
  friday: '金曜日',
  saturday: '土曜日',
}

interface ScrimSectionProps {
  config: Config
  onUpdate: Dispatch<SetStateAction<Config>>
}

export const ScrimSection = ({ config, onUpdate }: ScrimSectionProps) => {
  const mutate = (mutator: (draft: Config) => void) => {
    onUpdate((prev) => {
      const cloned: Config = structuredClone(prev)
      mutator(cloned)
      return cloned
    })
  }

  const handleToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target
    mutate((draft) => {
      draft.scrim.enabled = checked
    })
  }

  const handleInput = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof Config['scrim']
  ) => {
    const { value } = event.target
    mutate((draft) => {
      if (key === 'remindHourJst') {
        const numeric = Number(value)
        draft.scrim.remindHourJst = Number.isNaN(numeric)
          ? draft.scrim.remindHourJst
          : Math.min(23, Math.max(0, numeric))
        return
      }
      if (key === 'notes') {
        draft.scrim.notes = value
        return
      }
      if (key === 'summaryChannel' || key === 'managerChannel') {
        draft.scrim[key] = value
      }
    })
  }

  const handlePollDayChange = (event: ChangeEvent<HTMLSelectElement>) => {
    mutate((draft) => {
      draft.scrim.pollDay = event.target.value as Config['scrim']['pollDay']
    })
  }

  return (
    <div className="scrim">
      <label className="form-field form-field--checkbox">
        <input
          type="checkbox"
          checked={config.scrim.enabled}
          onChange={handleToggle}
        />
        <span>スクラム補助機能を有効化する（設計段階）</span>
      </label>

      <div className="form-grid">
        <label className="form-field">
          <span className="form-field__label">集計スレッド / チャンネル</span>
          <input
            type="text"
            value={config.scrim.summaryChannel}
            onChange={(event) => handleInput(event, 'summaryChannel')}
            placeholder="#scrim-planning"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">マネージャー通知先</span>
          <input
            type="text"
            value={config.scrim.managerChannel}
            onChange={(event) => handleInput(event, 'managerChannel')}
            placeholder="#manager"
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">参加希望確認日</span>
          <select value={config.scrim.pollDay} onChange={handlePollDayChange}>
            {Object.entries(weekdayLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">リマインド時刻 (JST)</span>
          <input
            type="number"
            min={0}
            max={23}
            value={config.scrim.remindHourJst}
            onChange={(event) => handleInput(event, 'remindHourJst')}
          />
        </label>
      </div>

      <label className="form-field form-field--wide">
        <span className="form-field__label">運用メモ</span>
        <textarea
          rows={4}
          value={config.scrim.notes}
          onChange={(event) => handleInput(event, 'notes')}
        />
      </label>

      <div className="scrim__note">
        <p>
          週次で参加希望者を集め、翌週の登録候補が揃い次第マネージャーに通知します。Cloud Scheduler 等の外部トリガーを想定し、Bot へ
          Webhook を送る構成です。
        </p>
        <ul>
          <li>有効化されるまでフロントでは設計情報のみ保持します。</li>
          <li>将来的にはFirestoreやSheetsに参加記録を保管する想定です。</li>
          <li>Discord 側の通知テンプレートは PR で追加予定です。</li>
        </ul>
      </div>
    </div>
  )
}
