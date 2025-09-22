import { useState } from 'react'

import type { SceneId } from '../types/scenes'
import { sceneOrder, sceneTitleMap } from '../types/scenes'

type SceneQuickPanelProps = {
  currentSceneId: SceneId
  goToScene: (scene: SceneId) => void
  goToNext: () => void
  goToPrevious: () => void
  onRestart: () => void
}

export const SceneQuickPanel = ({
  currentSceneId,
  goToScene,
  goToNext,
  goToPrevious,
  onRestart,
}: SceneQuickPanelProps) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <aside
      className={`scene-quick ${isOpen ? 'is-open' : ''}`}
      aria-label="シーンのショートカット"
    >
      <button
        type="button"
        className="scene-quick__toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'クイックパネルを閉じる' : 'クイックパネルを開く'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? '×' : 'Scene Nav'}
      </button>
      <div className="scene-quick__panel" aria-hidden={!isOpen}>
        <div className="scene-quick__controls">
          <button
            type="button"
            onClick={goToPrevious}
            className="scene-quick__control"
            aria-label="前のシーンへ"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="scene-quick__control"
            aria-label="次のシーンへ"
          >
            →
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="scene-quick__control scene-quick__control--restart"
            aria-label="最初のシーンに戻る"
          >
            reset
          </button>
        </div>
        <ul className="scene-quick__list">
          {sceneOrder.map((sceneId, index) => (
            <li key={sceneId}>
              <button
                type="button"
                className={`scene-quick__item${sceneId === currentSceneId ? ' is-active' : ''}`}
                onClick={() => goToScene(sceneId)}
              >
                <span className="scene-quick__item-index">
                  {index + 1}
                </span>
                <span>{sceneTitleMap[sceneId]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
