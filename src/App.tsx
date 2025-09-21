import { useMemo, useState } from 'react'

import './App.css'
import { DashboardSection } from './components/DashboardSection'
import { IntroductionsSection } from './components/IntroductionsSection'
import { RolesSection } from './components/RolesSection'
import { ScrimSection } from './components/ScrimSection'
import { Section } from './components/Section'
import { VerifySection } from './components/VerifySection'
import { WelcomeSection } from './components/WelcomeSection'
import { YamlPreviewSection } from './components/YamlPreviewSection'
import { defaultConfig } from './data/defaultConfig'
import type { Config } from './types/config'
import { diffLines } from './utils/diff'
import { generateConfigYaml } from './utils/yaml'

const cloneConfig = (config: Config): Config => structuredClone(config)

const navItems = [
  { id: 'dashboard', label: 'ダッシュボード' },
  { id: 'welcome', label: 'オンボーディング' },
  { id: 'verify', label: 'Verify' },
  { id: 'roles', label: 'ロール配布' },
  { id: 'introductions', label: '自己紹介' },
  { id: 'scrim', label: 'スクリム補助' },
  { id: 'yaml', label: 'YAML / PR' },
]

function App() {
  const [baselineConfig] = useState<Config>(() => cloneConfig(defaultConfig))
  const [config, setConfig] = useState<Config>(() => cloneConfig(defaultConfig))

  const baselineYaml = useMemo(
    () => generateConfigYaml(baselineConfig),
    [baselineConfig]
  )
  const generatedYaml = useMemo(() => generateConfigYaml(config), [config])
  const diff = useMemo(
    () => diffLines(baselineYaml, generatedYaml),
    [baselineYaml, generatedYaml]
  )

  const resetToBaseline = () => {
    setConfig(cloneConfig(baselineConfig))
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Nyaimlab Bot コントロールパネル</h1>
          <p className="app__subtitle">
            Discord オンボーディング、Verify、ロール配布、自己紹介設定を GitHub Pages 上から調整するための管理UIです。
          </p>
        </div>
        <button type="button" onClick={resetToBaseline} className="app__reset-button">
          変更をリセット
        </button>
      </header>
      <div className="app__layout">
        <nav className="app__sidebar" aria-label="セクションナビゲーション">
          <ol>
            {navItems.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>
        <main className="app__content">
          <Section
            id="dashboard"
            title="ダッシュボード"
            description="現在の設定サマリと主要な統計を確認できます。"
          >
            <DashboardSection config={config} />
          </Section>

          <Section
            id="welcome"
            title="オンボーディング"
            description="Welcome Embed とガイドラインDM、人数カウントなど入室時の体験を調整します。"
          >
            <WelcomeSection config={config} onUpdate={setConfig} />
          </Section>

          <Section
            id="verify"
            title="Verify 設定"
            description="/verify post コマンドで投稿するパネルとロール付与動作を設定します。"
          >
            <VerifySection config={config} onUpdate={setConfig} />
          </Section>

          <Section
            id="roles"
            title="ロール配布"
            description="/roles post のボタン／セレクト構成とロール文言を編集します。"
          >
            <RolesSection config={config} onUpdate={setConfig} />
          </Section>

          <Section
            id="introductions"
            title="自己紹介モーダル"
            description="/introduce の入力項目やNGワード、画像添付可否を管理します。"
          >
            <IntroductionsSection config={config} onUpdate={setConfig} />
          </Section>

          <Section
            id="scrim"
            title="スクリム補助（将来実装）"
            description="週次の参加確認やマネージャー通知など、今後実装予定のフローを設計します。"
          >
            <ScrimSection config={config} onUpdate={setConfig} />
          </Section>

          <Section
            id="yaml"
            title="YAML差分 & PR"
            description="生成された config.yaml と baseline の差分、PR 用テンプレートを確認します。"
          >
            <YamlPreviewSection
              config={config}
              yaml={generatedYaml}
              baselineYaml={baselineYaml}
              diff={diff}
            />
          </Section>
        </main>
      </div>
    </div>
  )
}

export default App
