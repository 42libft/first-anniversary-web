import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
}

export const Section = ({ id, title, description, children }: SectionProps) => (
  <section id={id} className="section">
    <header className="section__header">
      <h2 className="section__title">{title}</h2>
      {description ? (
        <p className="section__description">{description}</p>
      ) : null}
    </header>
    <div className="section__content">{children}</div>
  </section>
)
