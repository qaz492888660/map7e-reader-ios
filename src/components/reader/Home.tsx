import type { Book, ReaderSettings } from '../../types/book'
import Icon from './Icon'
interface Props {
  onResume: () => void
  hasPosition: boolean
  onNavigate: (page: 'library' | 'history' | 'settings') => void
  resume: Book
  progress: number
  ambience: ReaderSettings['ambience']
}
export default function Home({
  onNavigate,
  onResume,
  hasPosition,
  resume,
  progress,
  ambience,
}: Props) {
  return (
    <main className="home page">
      <header className="brand">
        <span className="brand-mark">
          <Icon name="leaf" />
        </span>
        <span>
          MAP7E <b>Reader</b>
        </span>
        <span className="brand-note">私人阅读空间</span>
      </header>
      <section className="greeting">
        <div className="eyebrow">
          <span />{' '}
          {ambience === 'ocean'
            ? 'A ROOM BENEATH THE WAVES'
            : ambience === 'shanhai'
              ? 'A ROOM BETWEEN MOUNTAINS AND SEA'
              : ambience === 'night'
                ? 'A ROOM UNDER THE NIGHT SKY'
                : 'A ROOM ABOVE THE CLOUDS'}
        </div>
        <h1 tabIndex={-1}>
          你好，枫<span>。</span>
        </h1>
        <p>留一点时间，给另一个世界。</p>
      </section>
      <nav className="bubble-nav" aria-label="书房入口">
        <button
          className="bubble bubble-resume"
          aria-label="继续阅读"
          onClick={onResume}
        >
          <Icon name="book" />
          <span className="bubble-label">继续阅读</span>
          <span className="bubble-book">{resume.title}</span>
          <span className="bubble-meta">
            {hasPosition
              ? `读至 ${Math.round(progress * 100)}%`
              : '从第一本学习书开始'}{' '}
            <Icon name="arrow" />
          </span>
        </button>
        <button
          className="bubble bubble-library"
          aria-label="我的书库"
          onClick={() => onNavigate('library')}
        >
          <Icon name="book" />
          <span className="bubble-label">我的书库</span>
          <span className="bubble-meta">我的收藏</span>
        </button>
        <button
          className="bubble bubble-history"
          onClick={() => onNavigate('history')}
        >
          <Icon name="history" />
          <span>阅读记录</span>
        </button>
        <button
          className="bubble bubble-settings"
          onClick={() => onNavigate('settings')}
        >
          <Icon name="settings" />
          <span>设置</span>
        </button>
        <span className="orbit-leaf" aria-hidden="true">
          <Icon name="leaf" />
        </span>
      </nav>
      <footer className="home-footer">
        <span /> 一隅书房，自在如枫 <span />
      </footer>
    </main>
  )
}
