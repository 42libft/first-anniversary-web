import type { ReactNode } from 'react'

interface SceneLayoutProps {
  eyebrow?: string
  title?: string
  description?: string
  children?: ReactNode
  onAdvance?: () => void
  advanceLabel?: string
  hideHeader?: boolean
}

export const SceneLayout = ({
  eyebrow,
  title,
  description,
  children,
  onAdvance,
  advanceLabel = '次へ',
  hideHeader = false,
}: SceneLayoutProps) => {
  const showEyebrow = !hideHeader && Boolean(eyebrow)
  const showTitle = !hideHeader && Boolean(title)
  const showDescription = !hideHeader && Boolean(description)

  return (
    <section className="scene-layout" role="presentation">
      <div className="scene-layout__content">
        {showEyebrow ? <p className="scene-layout__eyebrow">{eyebrow}</p> : null}
        {showTitle ? <h1 className="scene-layout__title">{title}</h1> : null}
        {showDescription ? (
          <p className="scene-layout__description">{description}</p>
        ) : null}
        {children ? <div className="scene-layout__body">{children}</div> : null}
      </div>
      {onAdvance ? (
        <button
          type="button"
          className="primary-button"
          onClick={onAdvance}
        >
          {advanceLabel}
        </button>
      ) : null}
    </section>
  )
}
