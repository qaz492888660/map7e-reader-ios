import type {
  Book,
  ReaderSettings,
  ReadingPosition,
} from '../../types/book'
import BookCover from './BookCover'
import PageHeader from './PageHeader'
import Icon from './Icon'
import { AmbienceOptions, ScriptOptions, ThemeOptions } from './Reader'
export function ReadingHistory({
  books,
  positions,
  progress,
  onOpen,
  onBack,
  onSettings,
}: {
  books: Book[]
  positions: Record<string, ReadingPosition>
  progress: (book: Book) => number
  onOpen: (b: Book) => void
  onBack: () => void
  onSettings: () => void
}) {
  const visited = books
    .filter((b) => positions[b.id])
    .sort((a, b) => positions[b.id].updatedAt - positions[a.id].updatedAt)
  return (
    <main className="page personal-page">
      <PageHeader
        title="阅读记录"
        onBack={onBack}
        onSettings={onSettings}
      />
      <div className="page-intro">
        <div className="eyebrow">WHERE YOU LEFT OFF</div>
        <h1 tabIndex={-1}>每一次，翻开。</h1>
        <p>只记录这台设备上，你停留过的书页。</p>
      </div>
      {visited.length ? (
        <div className="history-list">
          {visited.map((book) => (
            <button key={book.id} onClick={() => onOpen(book)}>
              <div className="history-cover">
                <BookCover book={book} />
              </div>
              <span>
                <strong>{book.title}</strong>
                <small>{book.author}</small>
                <small>
                  {book.sourceType === 'demo'
                    ? '演示正文'
                    : book.sourceType === 'bundled'
                      ? '公版全文'
                      : '私人书籍'} ·
                  读至 {Math.round(progress(book) * 100)}%
                </small>
              </span>
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="history" />
          <p>还没有留下阅读足迹。</p>
          <span>打开一本书，故事就从这里开始。</span>
        </div>
      )}
    </main>
  )
}
export function Settings({
  settings,
  onSettings,
  onBack,
  storageError,
}: {
  settings: ReaderSettings
  onSettings: (s: ReaderSettings) => void
  onBack: () => void
  storageError: boolean
}) {
  return (
    <main className="page personal-page">
      <PageHeader title="书房设置" onBack={onBack} />
      <div className="page-intro">
        <div className="eyebrow">MAKE YOURSELF AT HOME</div>
        <h1 tabIndex={-1}>舒服，就好。</h1>
        <p>调成你喜欢的样子。</p>
      </div>
      <section className="settings-section">
        <h2>阅读时的光</h2>
        <ThemeOptions settings={settings} onSettings={onSettings} />
        <h2>书房氛围</h2>
        <AmbienceOptions settings={settings} onSettings={onSettings} />
        <h2>正文文字</h2>
        <ScriptOptions settings={settings} onSettings={onSettings} />
        <div className="motion-setting">
          <span>
            <strong>环境动态</strong>
            <small>天空、山海与暗夜的背景动态，跟随系统减少动态设置</small>
          </span>
          <button
            className="switch"
            role="switch"
            aria-label="云层动态"
            aria-checked={settings.motion}
            onClick={() =>
              onSettings({ ...settings, motion: !settings.motion })
            }
          >
            <span />
          </button>
        </div>
        <p className="settings-note">
          {storageError
            ? '当前浏览器无法保存设置；本次打开期间仍可使用。'
            : '设置、私人文件与阅读进度仅保存在当前浏览器。清除网站数据后将丢失，请保留原始文件备份。'}
        </p>
      </section>
      <footer className="collection-note">
        <Icon name="leaf" />
        <p>MAP7E Reader</p>
        <span>属于枫的私人阅读空间</span>
      </footer>
    </main>
  )
}
