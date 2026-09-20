import {
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import type {
  Chapter,
  ReaderSettings,
  ReadingPosition,
} from '../types/book'
import {
  COLUMN_GAP,
  measurePages,
  pageForAnchor,
} from '../services/pagination'
import { displayOffsetToSource } from '../services/textScript'

export function usePagination(
  chapter: Chapter,
  displayedParagraphs: string[],
  settings: ReaderSettings,
  anchor: MutableRefObject<ReadingPosition>,
) {
  const viewport = useRef<HTMLDivElement>(null)
  const article = useRef<HTMLElement>(null)
  const [layout, setLayout] = useState({
    pages: [{ paragraphIndex: 0, characterOffset: 0 }],
    page: 0,
    width: 0,
    ready: false,
    animate: false,
  })
  useLayoutEffect(() => {
    const box = viewport.current,
      body = article.current
    if (!box || !body) return
    let active = true,
      frame = 0
    function measure() {
      if (!active || !box || !body) return
      const width = box.clientWidth,
        height = box.clientHeight
      if (!width || !height) {
        setLayout((old) => ({ ...old, ready: false, animate: false }))
        return
      }
      body.style.setProperty('--page-width', `${width}px`)
      const pages = measurePages(body, width, (paragraphIndex, displayOffset) =>
        displayOffsetToSource(
          chapter.paragraphs[paragraphIndex] || '',
          displayedParagraphs[paragraphIndex] || '',
          displayOffset,
        ),
      )
      setLayout({
        pages,
        page: pageForAnchor(pages, anchor.current),
        width,
        ready: true,
        animate: false,
      })
    }
    function schedule() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    const observer = new ResizeObserver(schedule)
    observer.observe(box)
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    document.fonts?.addEventListener('loadingdone', schedule)
    void document.fonts?.ready.then(() => {
      if (active) schedule()
    })
    return () => {
      active = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      document.fonts?.removeEventListener('loadingdone', schedule)
    }
  }, [
    chapter,
    displayedParagraphs,
    settings.fontSize,
    settings.fontFamily,
    settings.lineHeight,
    settings.pageMargin,
    anchor,
  ])
  function showPage(page: number) {
    anchor.current = {
      ...anchor.current,
      ...layout.pages[page],
      completed: false,
    }
    setLayout((old) => ({ ...old, page, animate: true }))
  }
  return {
    viewport,
    article,
    ...layout,
    stride: layout.width + COLUMN_GAP,
    showPage,
  }
}
