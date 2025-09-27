import { useState } from 'react'
import type { CSSProperties } from 'react'

import { SceneLayout } from '../components/SceneLayout'
import { meetupPages } from '../data/meetups'
import type { SceneComponentProps } from '../types/scenes'
import { useActionHistory } from '../history/ActionHistoryContext'

export const MeetupsScene = ({ onAdvance }: SceneComponentProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const { record } = useActionHistory()
  const activePage = meetupPages[activeIndex]

  const handlePrev = () => {
    if (activeIndex <= 0) {
      return
    }
    const snapshotIndex = activeIndex
    record(() => {
      setActiveIndex(snapshotIndex)
    }, { label: 'Meetups: previous page' })
    setActiveIndex(Math.max(activeIndex - 1, 0))
  }

  const handleNext = () => {
    if (activeIndex >= meetupPages.length - 1) {
      onAdvance()
      return
    }
    const snapshotIndex = activeIndex
    record(() => {
      setActiveIndex(snapshotIndex)
    }, { label: 'Meetups: next page' })
    setActiveIndex(Math.min(activeIndex + 1, meetupPages.length - 1))
  }

  const handleSelect = (index: number) => {
    if (index === activeIndex) {
      return
    }
    const snapshotIndex = activeIndex
    record(() => {
      setActiveIndex(snapshotIndex)
    }, { label: `Meetups: select page ${index + 1}` })
    setActiveIndex(index)
  }

  const isFirst = activeIndex === 0
  const isLast = activeIndex === meetupPages.length - 1

  return (
    <SceneLayout
      eyebrow="Meetups"
      title="月ごとのアルバム"
      description="月替わりのメディアアート背景に写真と手書きメモを載せる、展示会のようなギャラリーセクション。"
    >
      <div className="meetups-gallery">
        <section
          className="meetups-art"
          style={{
            background: activePage.background,
            '--meetups-accent': activePage.accent,
            '--meetups-ambient': activePage.ambient,
          } as CSSProperties}
        >
          <div className="meetups-art__glow" aria-hidden="true" />
          <img
            className="meetups-art__photo"
            src={activePage.photo.src}
            alt={activePage.photo.alt}
            loading="lazy"
            style={
              activePage.photo.objectPosition
                ? { objectPosition: activePage.photo.objectPosition }
                : undefined
            }
          />
          <header className="meetups-art__header">
            <span className="meetups-art__month">{activePage.monthLabel}</span>
            <h3 className="meetups-art__title">{activePage.title}</h3>
            <p className="meetups-art__subtitle">{activePage.subtitle}</p>
          </header>
        </section>

        <section className="meetups-notes">
          <p className="meetups-notes__description">{activePage.description}</p>
          <ul className="meetups-notes__list">
            {activePage.memoryPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          {activePage.footnote ? (
            <p className="meetups-notes__footnote">{activePage.footnote}</p>
          ) : null}
        </section>

        <div className="meetups-controls">
          <button
            type="button"
            className="meetups-controls__button"
            onClick={handlePrev}
            disabled={isFirst}
          >
            前のページ
          </button>
          <button
            type="button"
            className="meetups-controls__button meetups-controls__button--primary"
            onClick={handleNext}
          >
            {isLast ? 'Letterへ' : '次のページ'}
          </button>
        </div>

        <nav className="meetups-timeline" aria-label="Meetups timeline">
          {meetupPages.map((page, index) => {
            const className = [
              'meetups-timeline__item',
              index === activeIndex ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={page.id}
                type="button"
                className={className}
                onClick={() => handleSelect(index)}
                aria-current={index === activeIndex}
              >
                <span className="meetups-timeline__month">{page.monthLabel}</span>
                <span className="meetups-timeline__label">{page.title}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </SceneLayout>
  )
}
