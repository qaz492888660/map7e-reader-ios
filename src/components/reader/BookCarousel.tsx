import { useLayoutEffect, useRef, useState } from 'react'
import type { Book } from '../../types/book'
import BookCover from './BookCover'
import Icon from './Icon'

interface Props {
  books: Book[]
  selectedId: string
  onSelect: (id: string) => void
  onOpen: (book: Book) => void
  motion: boolean
}
export default function BookCarousel({
  books,
  selectedId,
  onSelect,
  onOpen,
  motion,
}: Props) {
  const track = useRef<HTMLDivElement>(null)
  const active = Math.max(
    0,
    books.findIndex((b) => b.id === selectedId),
  )
  const [current, setCurrent] = useState(active)
  const currentIndex = useRef(active)
  const [caption, setCaption] = useState(active)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>()
  const frame = useRef(0)
  const dragStart = useRef({ x: 0, y: 0, moved: false })
  const signature = books.map((b) => b.id).join('|')
  const reduced = () =>
    !motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  function center(index: number, smooth = true) {
    const el = track.current
    const child = el?.children[index] as HTMLElement | undefined
    if (!el || !child) return
    el.scrollTo({
      left: child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2,
      behavior: smooth && !reduced() ? 'smooth' : 'instant',
    })
  }
  useLayoutEffect(() => {
    setCurrent(active)
    setCaption(active)
    currentIndex.current = active
    center(active, false)
    const observer = new ResizeObserver(() =>
      center(currentIndex.current, false),
    )
    if (track.current) observer.observe(track.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame.current)
      clearTimeout(settleTimer.current)
    }
    // Re-center only when the collection changes; selection follows native scrolling.
  }, [signature])
  function onScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = track.current
      if (!el) return
      let nearest = 0
      let distance = Infinity
      Array.from(el.children).forEach((child, i) => {
        const item = child as HTMLElement
        const delta = Math.abs(
          item.offsetLeft +
            item.offsetWidth / 2 -
            el.scrollLeft -
            el.clientWidth / 2,
        )
        if (delta < distance) {
          distance = delta
          nearest = i
        }
      })
      setCurrent(nearest)
      currentIndex.current = nearest
      if (books[nearest]) onSelect(books[nearest].id)
      clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(() => setCaption(nearest), 140)
    })
  }
  const book = books[caption] || books[0]
  if (!book) return <p className="empty-state">书架空着，换一个关键词试试。</p>
  return (
    <section
      className="book-carousel"
      aria-label="滑动书架"
      aria-roledescription="轮播"
    >
      <div
        className="book-track"
        ref={track}
        onScroll={onScroll}
        onPointerDown={(e) => {
          dragStart.current = { x: e.clientX, y: e.clientY, moved: false }
        }}
        onPointerMove={(e) => {
          if (
            Math.abs(e.clientX - dragStart.current.x) > 8 ||
            Math.abs(e.clientY - dragStart.current.y) > 8
          )
            dragStart.current.moved = true
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault()
            center(
              Math.max(
                0,
                Math.min(
                  books.length - 1,
                  current + (e.key === 'ArrowRight' ? 1 : -1),
                ),
              ),
            )
          }
        }}
      >
        {books.map((item, index) => (
          <div
            className={`book-slide ${index === current ? 'is-current' : ''} ${index < current ? 'is-before' : 'is-after'}`}
            key={item.id}
          >
            <button
              className="cover-button"
              aria-label={`${index === current ? '查看' : '选择'}《${item.title}》`}
              aria-current={index === current ? 'true' : undefined}
              onFocus={() => center(index)}
              onClick={(e) => {
                if (e.detail !== 0 && dragStart.current.moved) return
                if (index === current) onOpen(item)
                else center(index)
              }}
            >
              <BookCover book={item} />
            </button>
          </div>
        ))}
      </div>
      <div className="glass-shelf" aria-hidden="true" />
      <div className="carousel-caption" aria-live="polite" aria-atomic="true">
        <h2 key={book.id}>
          {book.title}
          {book.edition && <small>{book.edition}</small>}
        </h2>
        <p>
          {book.author} <span>·</span> {book.category}
        </p>
      </div>
      {book.learningStage && <p className="shelf-bookmark">{book.tags?.[0]}</p>}
      <div className="carousel-controls">
        <button
          className="icon-button"
          aria-label="上一本"
          disabled={current === 0}
          onClick={() => center(current - 1)}
        >
          <Icon name="back" />
        </button>
        <span className="carousel-count">
          {String(current + 1).padStart(2, '0')} <i />{' '}
          {String(books.length).padStart(2, '0')}
        </span>
        <button
          className="icon-button"
          aria-label="下一本"
          disabled={current === books.length - 1}
          onClick={() => center(current + 1)}
        >
          <Icon name="arrow" />
        </button>
      </div>
    </section>
  )
}
