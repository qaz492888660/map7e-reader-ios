import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import type {
  Book,
  BookContent,
  ReaderSettings,
  ReadingPosition,
} from '../../types/book'
import { usePagination } from '../../hooks/usePagination'
import {
  readingProgress,
  resolvePosition,
} from '../../services/readingPosition'
import PageHeader from './PageHeader'
import Sheet from './Sheet'
import Icon from './Icon'
import { convertText } from '../../services/textScript'
import OceanBackground from './OceanBackground'
import ScenicBackground from './ScenicBackground'
interface Props {
  book: Book
  content: BookContent
  storageError: boolean
  position?: ReadingPosition
  settings: ReaderSettings
  onSettings: (s: ReaderSettings) => void
  onPosition: (p: ReadingPosition) => void
  onBack: () => void
}
export default function Reader({
  book,
  content,
  storageError,
  position,
  settings,
  onSettings,
  onPosition,
  onBack,
}: Props) {
  const [initial] = useState(() => resolvePosition(content, position))
  const anchor = useRef(initial)
  const [chapterIndex, setChapter] = useState(() =>
    content.chapters.findIndex((c) => c.id === initial.chapterId),
  )
  const chapter = content.chapters[chapterIndex]
  const displayChapter = useMemo(
    () => ({
      title: convertText(chapter.title, settings.script),
      paragraphs: chapter.paragraphs.map((text) =>
        convertText(text, settings.script),
      ),
    }),
    [chapter, settings.script],
  )
  const pagination = usePagination(
    chapter,
    displayChapter.paragraphs,
    settings,
    anchor,
  )
  const [controls, setControls] = useState(false)
  const [panel, setPanel] = useState<
    'contents' | 'font' | 'theme' | 'settings' | null
  >(null)
  const [completed, setCompleted] = useState(!!initial.completed)
  const callback = useRef(onPosition)
  callback.current = onPosition
  const drag = useRef<{
    id: number
    x: number
    y: number
    time: number
    selected: boolean
  } | null>(null)
  const suppressClick = useRef(0)
  const selection = () => !!window.getSelection()?.toString()
  function publish() {
    callback.current({ ...anchor.current, updatedAt: Date.now() })
  }
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState === 'hidden') publish()
    }
    window.addEventListener('pagehide', publish)
    document.addEventListener('visibilitychange', hidden)
    publish()
    return () => {
      publish()
      window.removeEventListener('pagehide', publish)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [])
  function moveChapter(index: number, end = false) {
    const next = content.chapters[index]
    const paragraphIndex = end ? Math.max(0, next.paragraphs.length - 1) : 0
    anchor.current = {
      chapterId: next.id,
      paragraphIndex,
      characterOffset: end
        ? next.paragraphs[paragraphIndex]?.length || 0
        : 0,
      contentRevision: content.revision,
      updatedAt: Date.now(),
    }
    setCompleted(false)
    if (index === chapterIndex && pagination.ready)
      pagination.showPage(end ? pagination.pages.length - 1 : 0)
    setChapter(index)
    setPanel(null)
    publish()
  }
  function turn(direction: -1 | 1) {
    if (!pagination.ready || panel) return
    const page = pagination.page + direction
    if (page >= 0 && page < pagination.pages.length) {
      pagination.showPage(page)
      setCompleted(false)
      publish()
    } else if (direction === -1 && chapterIndex > 0)
      moveChapter(chapterIndex - 1, true)
    else if (direction === 1 && chapterIndex < content.chapters.length - 1)
      moveChapter(chapterIndex + 1)
    else if (direction === 1) {
      const paragraphIndex = Math.max(0, chapter.paragraphs.length - 1)
      anchor.current = {
        ...anchor.current,
        paragraphIndex,
        characterOffset: chapter.paragraphs[paragraphIndex]?.length || 0,
        completed: true,
      }
      setCompleted(true)
      setControls(true)
      publish()
    }
  }
  function pointerUp(e: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    drag.current = null
    if (!start || start.id !== e.pointerId) return
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y
    const elapsed = performance.now() - start.time
    if (start.selected || selection() || elapsed > 500) {
      suppressClick.current = performance.now() + 500
      return
    }
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressClick.current = performance.now() + 500
      turn(dx < 0 ? 1 : -1)
    } else if (Math.abs(dx) > 8 || Math.abs(dy) > 8)
      suppressClick.current = performance.now() + 500
  }
  const total = readingProgress(content, anchor.current)
  const atStart = chapterIndex === 0 && pagination.page === 0
  return (
    <main
      className={`reader paged-reader theme-${settings.theme} ambience-${settings.ambience} ${settings.motion ? '' : 'motion-paused'}`}
      style={
        {
          '--reading-size': `${settings.fontSize}px`,
          '--reading-line-height': settings.lineHeight,
          '--reading-margin': `${settings.pageMargin}px`,
        } as CSSProperties
      }
    >
      {settings.ambience === 'ocean' ? (
        <OceanBackground motion={settings.motion} variant="reader" />
      ) : (
        <ScenicBackground
          key={settings.ambience}
          scene={settings.ambience}
          motion={settings.motion}
          variant="reader"
        />
      )}
      <div
        className={`reader-stage font-${settings.fontFamily}`}
        role="region"
        aria-label="阅读正文，左右翻页，中央显示工具"
        tabIndex={0}
        onKeyDown={(e) => {
          if (selection() || e.altKey || e.ctrlKey || e.metaKey) return
          if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault()
            turn(1)
          } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault()
            turn(-1)
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setControls((v) => !v)
          } else if (e.key === 'Escape') setControls(false)
        }}
        onPointerDown={(e) => {
          if (!e.isPrimary || e.button !== 0) {
            drag.current = null
            suppressClick.current = performance.now() + 500
            return
          }
          drag.current = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            time: performance.now(),
            selected: selection(),
          }
        }}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          drag.current = null
          suppressClick.current = performance.now() + 500
        }}
        onClick={(e) => {
          if (
            performance.now() < suppressClick.current ||
            selection() ||
            panel
          )
            return
          const box = e.currentTarget.getBoundingClientRect()
          if (!box.width) return
          const x = (e.clientX - box.left) / box.width
          if (x < 0.25) turn(-1)
          else if (x > 0.75) turn(1)
          else setControls((v) => !v)
        }}
      >
        <div className="page-window" ref={pagination.viewport}>
          <article
            key={chapter.id}
            ref={pagination.article}
            className={`reader-content reader-columns ${pagination.animate ? 'page-turn' : ''}`}
            style={{
              transform: `translateX(${-pagination.page * pagination.stride}px)`,
            }}
          >
            <div className="eyebrow">
              {content.format === 'demo'
                ? '演示正文 · 非原著内容'
                : content.format === 'public-domain'
                  ? '公版原文 · ' + (book.edition || book.title)
                  : '私人导入 · ' + (book.edition || book.title)}
            </div>
            <h1>{displayChapter.title}</h1>
            {displayChapter.paragraphs.map((text, i) => (
              <p data-paragraph={i} key={i}>
                {text}
              </p>
            ))}
          </article>
        </div>
      </div>
      {!pagination.ready && (
        <p className="pagination-notice" role="status">
          正在计算分页…
        </p>
      )}
      {controls && (
        <>
          <div className="reader-top-controls">
            <PageHeader
              title={book.title}
              onBack={onBack}
              onSettings={() => setPanel('settings')}
            />
            <p>{displayChapter.title}</p>
          </div>
          <div className="reader-expanded-controls">
            <div className="reader-page-status" aria-live="polite">
              {completed
                ? '已读完'
                : `第 ${chapterIndex + 1} 章 · 本章 ${pagination.page + 1} / ${pagination.pages.length} 页`}
            </div>
            <nav aria-label="阅读工具">
              <button
                aria-label="上一页"
                disabled={atStart || !pagination.ready}
                onClick={() => turn(-1)}
              >
                <Icon name="back" />
              </button>
              <button onClick={() => setPanel('contents')}>目录</button>
              <button aria-label="字体" onClick={() => setPanel('font')}>
                字号 / 排版
              </button>
              <button onClick={() => setPanel('theme')}>主题</button>
              <button
                aria-label="下一页"
                disabled={completed || !pagination.ready}
                onClick={() => turn(1)}
              >
                <Icon name="arrow" />
              </button>
            </nav>
            {completed && (
              <button className="text-button" onClick={onBack}>
                读完了，合上书
              </button>
            )}
          </div>
        </>
      )}
      <footer className="reader-persistent-progress">
        <progress max={1} value={total} aria-label="当前阅读进度" />
        <span>{Math.round(total * 100)}%</span>
        <button
          aria-label={controls ? '隐藏阅读工具' : '显示阅读工具'}
          aria-expanded={controls}
          onClick={() => setControls((v) => !v)}
        >
          <Icon name="menu" />
        </button>
      </footer>
      {storageError && (
        <p className="reader-save-error" role="status">
          阅读位置暂时未能完整保存，请保留当前页面。
        </p>
      )}
      {panel && (
        <Sheet
          title={
            panel === 'contents'
              ? '目录'
              : panel === 'theme'
                ? '阅读主题'
                : panel === 'settings'
                  ? '阅读设置'
                  : '文字与排版'
          }
          onClose={() => setPanel(null)}
        >
          {panel === 'contents' && (
            <ol className="contents-list">
              {content.chapters.map((c, i) => (
                <li key={c.id}>
                  <button
                    aria-current={i === chapterIndex ? 'true' : undefined}
                    onClick={() => moveChapter(i)}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {convertText(c.title, settings.script)}
                    {i === chapterIndex && <small>正在读</small>}
                  </button>
                </li>
              ))}
            </ol>
          )}
          {(panel === 'font' || panel === 'settings') && (
            <>
              <p className="setting-label">字号</p>
              <div className="option-row">
                {[17, 19, 21, 23, 25].map((size) => (
                  <button
                    key={size}
                    aria-pressed={settings.fontSize === size}
                    onClick={() =>
                      onSettings({ ...settings, fontSize: size })
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="setting-label">字体</p>
              <div className="option-row">
                {(['serif', 'sans'] as const).map((fontFamily, i) => (
                  <button
                    key={fontFamily}
                    aria-pressed={settings.fontFamily === fontFamily}
                    onClick={() => onSettings({ ...settings, fontFamily })}
                  >
                    {['宋体 / 衬线', '黑体 / 无衬线'][i]}
                  </button>
                ))}
              </div>
              <p className="setting-label">文字</p>
              <ScriptOptions settings={settings} onSettings={onSettings} />
              <p className="setting-label">行距</p>
              <div className="option-row">
                {[1.65, 1.85, 2.05].map((lineHeight) => (
                  <button
                    key={lineHeight}
                    aria-label={`行距 ${lineHeight}`}
                    aria-pressed={settings.lineHeight === lineHeight}
                    onClick={() => onSettings({ ...settings, lineHeight })}
                  >
                    {lineHeight}
                  </button>
                ))}
              </div>
              <p className="setting-label">左右页边距</p>
              <div className="option-row">
                {[18, 26, 34].map((pageMargin) => (
                  <button
                    key={pageMargin}
                    aria-label={`边距 ${pageMargin}`}
                    aria-pressed={settings.pageMargin === pageMargin}
                    onClick={() => onSettings({ ...settings, pageMargin })}
                  >
                    {pageMargin}px
                  </button>
                ))}
              </div>
            </>
          )}
          {(panel === 'theme' || panel === 'settings') && (
            <>
              <p className="setting-label">阅读底色</p>
              <ThemeOptions settings={settings} onSettings={onSettings} />
              <p className="setting-label">氛围</p>
              <AmbienceOptions settings={settings} onSettings={onSettings} />
            </>
          )}
        </Sheet>
      )}
    </main>
  )
}
export function ScriptOptions({
  settings,
  onSettings,
}: {
  settings: ReaderSettings
  onSettings: (s: ReaderSettings) => void
}) {
  return (
    <div className="option-row script-options">
      {(['original', 'simplified', 'traditional'] as const).map(
        (script, i) => (
          <button
            key={script}
            aria-pressed={settings.script === script}
            onClick={() => onSettings({ ...settings, script })}
          >
            {['原文', '简体', '繁体'][i]}
          </button>
        ),
      )}
    </div>
  )
}

export function AmbienceOptions({
  settings,
  onSettings,
}: {
  settings: ReaderSettings
  onSettings: (s: ReaderSettings) => void
}) {
  return (
    <div className="option-row ambience-options">
      {(['sky', 'ocean', 'shanhai', 'night'] as const).map((ambience, i) => (
        <button
          key={ambience}
          aria-pressed={settings.ambience === ambience}
          onClick={() => onSettings({ ...settings, ambience })}
        >
          {['天空', '海洋', '山海', '暗夜'][i]}
        </button>
      ))}
    </div>
  )
}

export function ThemeOptions({
  settings,
  onSettings,
}: {
  settings: ReaderSettings
  onSettings: (s: ReaderSettings) => void
}) {
  return (
    <div className="option-row theme-options">
      {(['paper', 'white', 'night'] as const).map((theme, i) => (
        <button
          key={theme}
          className={`theme-${theme}`}
          aria-pressed={settings.theme === theme}
          onClick={() => onSettings({ ...settings, theme })}
        >
          <span>字</span>
          {['暖纸', '素白', '夜读'][i]}
        </button>
      ))}
    </div>
  )
}
