import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import type { MeetupEntry } from '../types/meetup'

interface MeetupGalleryProps {
  meetups: MeetupEntry[]
}

const clampIndex = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const SWIPE_THRESHOLD_PX = 40

export const MeetupGallery = ({ meetups }: MeetupGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const pointerStartX = useRef<number | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const totalMeetups = meetups.length
  const activeMeetup = meetups[activeIndex]

  useEffect(() => {
    if (!activeMeetup) {
      setAnnouncement('')
      return
    }
    setAnnouncement(`${activeMeetup.monthLabel} — ${activeMeetup.title}`)
  }, [activeMeetup])

  const goTo = (index: number) => {
    if (!totalMeetups) return
    setActiveIndex((prev) => {
      const clamped = clampIndex(index, 0, totalMeetups - 1)
      if (clamped === prev) return prev
      return clamped
    })
  }

  const goNext = () => goTo(activeIndex + 1)
  const goPrev = () => goTo(activeIndex - 1)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goNext()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goPrev()
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX
    viewportRef.current?.setPointerCapture(event.pointerId)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return

    const delta = event.clientX - pointerStartX.current
    if (delta > SWIPE_THRESHOLD_PX) {
      goPrev()
    } else if (delta < -SWIPE_THRESHOLD_PX) {
      goNext()
    }

    pointerStartX.current = null
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = null
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const accentColor = activeMeetup?.art.accent ?? '#ff66c4'

  const galleryStyle = useMemo(
    () => ({ '--meetup-active-accent': accentColor } as CSSProperties),
    [accentColor]
  )

  const trackStyle = useMemo(
    () => ({ transform: `translateX(-${activeIndex * 100}%)` }),
    [activeIndex]
  )

  return (
    <section
      className="meetups-gallery"
      style={galleryStyle}
      aria-roledescription="carousel"
      aria-label="月ごとの思い出アルバム"
    >
      <div
        className="meetups-gallery__viewport"
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        role="group"
        aria-live="polite"
        tabIndex={0}
      >
        <div className="meetups-gallery__track" style={trackStyle}>
          {meetups.map((meetup, index) => (
            <MeetupCard
              key={meetup.id}
              meetup={meetup}
              isActive={index === activeIndex}
            />
          ))}
        </div>
      </div>
      <p className="meetups-gallery__hint">スワイプかボタンで月を切り替えできます。</p>
      <div className="meetups-gallery__controls">
        <button
          type="button"
          className="meetups-gallery__control"
          onClick={goPrev}
          disabled={activeIndex === 0}
        >
          前の月
        </button>
        <div className="meetups-gallery__status" aria-live="polite">
          {announcement}
        </div>
        <button
          type="button"
          className="meetups-gallery__control"
          onClick={goNext}
          disabled={activeIndex === totalMeetups - 1}
        >
          次の月
        </button>
      </div>
      <div className="meetups-gallery__dots" role="tablist" aria-label="月一覧">
        {meetups.map((meetup, index) => (
          <button
            key={meetup.id}
            type="button"
            className={`meetups-gallery__dot${
              index === activeIndex ? ' meetups-gallery__dot--active' : ''
            }`}
            onClick={() => goTo(index)}
            aria-label={`${meetup.monthLabel} ${meetup.title}`}
            aria-pressed={index === activeIndex}
          />
        ))}
      </div>
    </section>
  )
}

interface MeetupCardProps {
  meetup: MeetupEntry
  isActive: boolean
}

const MeetupCard = ({ meetup, isActive }: MeetupCardProps) => {
  const {
    art: { gradient, overlay, overlayOpacity, accent, noiseOpacity },
  } = meetup

  const cardStyle = useMemo(
    () =>
      ({
        '--meetup-art-gradient': gradient,
        '--meetup-art-overlay': overlay ?? 'none',
        '--meetup-art-overlay-opacity': String(overlayOpacity ?? 0.35),
        '--meetup-art-accent': accent,
        '--meetup-art-noise-opacity': String(noiseOpacity ?? 0.22),
      }) as CSSProperties,
    [gradient, overlay, overlayOpacity, accent, noiseOpacity]
  )

  const photoAspect = meetup.photo.aspectRatio ?? 3 / 4

  return (
    <article
      className="meetup-card"
      style={cardStyle}
      aria-hidden={!isActive}
      tabIndex={isActive ? 0 : -1}
    >
      <div className="meetup-card__art" aria-hidden="true">
        <div className="meetup-card__grain" />
      </div>
      <div className="meetup-card__content">
        <header className="meetup-card__header">
          <span className="meetup-card__month">{meetup.monthLabel}</span>
          <h2 className="meetup-card__title">{meetup.title}</h2>
          <p className="meetup-card__location">{meetup.location}</p>
        </header>
        <figure
          className="meetup-card__photo"
          style={{ aspectRatio: photoAspect } as CSSProperties}
        >
          <img src={meetup.photo.url} alt={meetup.photo.alt} />
          {meetup.photo.caption ? (
            <figcaption className="meetup-card__caption">
              {meetup.photo.caption}
            </figcaption>
          ) : null}
        </figure>
        <p className="meetup-card__summary">{meetup.summary}</p>
        <ul className="meetup-card__moments">
          {meetup.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
        {meetup.memo ? (
          <p className="meetup-card__memo">{meetup.memo}</p>
        ) : null}
      </div>
    </article>
  )
}
