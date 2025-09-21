import type { Config } from '../types/config'

interface DashboardSectionProps {
  config: Config
}

const channelLabels: Array<{ key: keyof Config['channels']; label: string }> = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'verify_panel', label: 'Verifyパネル' },
  { key: 'roles_panel', label: 'ロール配布' },
  { key: 'introductions', label: '自己紹介' },
  { key: 'audit_log', label: '監査ログ' },
  { key: 'fallback_notice', label: 'DM代替案内' },
]

export const DashboardSection = ({ config }: DashboardSectionProps) => {
  const totalSelectable = config.roles.selectable.length
  const totalOptional = config.roles.optional.length

  return (
    <div className="dashboard">
      <div className="dashboard__metrics">
        <article className="metric-card">
          <h3 className="metric-card__label">Guild ID</h3>
          <p className="metric-card__value">{config.guild.id || '未設定'}</p>
        </article>
        <article className="metric-card">
          <h3 className="metric-card__label">Verify モード</h3>
          <p className="metric-card__value metric-card__value--accent">
            {config.features.verify_mode === 'button' ? 'ボタン' : 'リアクション'}
          </p>
          <p className="metric-card__hint">roles.verified: {config.roles.verified || '未設定'}</p>
        </article>
        <article className="metric-card">
          <h3 className="metric-card__label">ロール数</h3>
          <p className="metric-card__value">
            {totalSelectable + totalOptional}
            <span className="metric-card__hint">（選択 {totalSelectable} / 任意 {totalOptional}）</span>
          </p>
        </article>
        <article className="metric-card">
          <h3 className="metric-card__label">NGワード</h3>
          <p className="metric-card__value">{config.introductions.ngWords.length} 件</p>
          <p className="metric-card__hint">画像添付: {config.introductions.imageAttachment.allow ? '許可' : '禁止'}</p>
        </article>
      </div>
      <div className="dashboard__channels">
        <h3 className="dashboard__channels-title">チャンネル設定</h3>
        <dl className="channel-list">
          {channelLabels.map(({ key, label }) => (
            <div key={key} className="channel-list__item">
              <dt>{label}</dt>
              <dd>{config.channels[key] || '未設定'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="dashboard__notes">
        <p>
          ガイドラインURL: <span className="dashboard__highlight">{config.notion.guidelines_url || '未設定'}</span>
        </p>
        <p>
          Welcome DM テンプレート内のプレースホルダー{' '}
          <code>{'{notionUrl}'}</code> / <code>{'{roles_panel}'}</code> は自動置換されます。
        </p>
      </div>
    </div>
  )
}
