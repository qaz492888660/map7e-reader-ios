import { useState } from 'react'
import Sheet from './Sheet'
import type { Book } from '../../types/book'
import BookCover from './BookCover'
import PageHeader from './PageHeader'
import Icon from './Icon'
export default function BookDetail({
  book,
  progress,
  onBack,
  onRead,
  onImport,
  loading,
  error,
  onRetry,
  onRemove,
  onSettings,
}: {
  book: Book
  progress: number
  onBack: () => void
  onRead: () => void
  onImport: () => void
  loading: boolean
  error: string
  onRetry: () => void
  onRemove: () => Promise<void>
  onSettings: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')
  return (
    <main className="detail page">
      <PageHeader
        title="书的一页"
        onBack={onBack}
        onSettings={onSettings}
      />
      <div className="detail-cover">
        <BookCover book={book} />
      </div>
      <section className="detail-info">
        <div className="eyebrow">{book.category} / 私人藏书</div>
        <h1 tabIndex={-1}>{book.title}</h1>
        <p className="detail-author">
          {book.author}
          {book.edition && <> · {book.edition}</>}
        </p>
        {book.learningStage && (
          <p className="learning-stage">{book.learningStage}</p>
        )}
        <div className="detail-divider" />
        <p className="description">{book.description}</p>
        <div className="reading-status">
          <span>
            {loading
              ? '正在读取本地书库'
              : book.availability !== 'ready'
                ? '正文文件尚未导入'
                : progress > 0
                  ? '上次停在这里'
                  : '还未翻开的世界'}
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <progress max={1} value={progress} aria-label="阅读进度" />
        {error && (
          <p className="import-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary-button"
          disabled={loading}
          onClick={
            error
              ? onRetry
              : book.availability === 'ready'
                ? onRead
                : onImport
          }
        >
          <Icon name="book" />
          {loading
            ? '正在打开书库…'
            : error
              ? '重试打开书库'
              : book.availability !== 'ready'
                ? '导入书籍开始学习'
                : progress >= 1
                  ? '重新阅读'
                  : progress > 0
                    ? '继续阅读'
                    : '开始阅读'}
          <Icon name="arrow" />
        </button>
        {book.sourceType === 'private' &&
          book.availability !== 'missing' && (
            <div className="private-file-actions">
              <button className="text-button" onClick={onImport}>
                替换私人书籍文件
              </button>
              <button
                className="text-button remove-file"
                onClick={() => {
                  setRemoveError('')
                  setConfirmRemove(true)
                }}
              >
                移除已导入文件
              </button>
            </div>
          )}
        <p className="demo-note">
          {book.sourceType === 'demo'
            ? '示例藏书 · 封面为书房设计，正文为演示片段'
            : book.sourceType === 'bundled'
              ? '公版 · 可直接阅读 · MAP7E 自制书封'
              : book.availability === 'stored'
                ? 'EPUB 已保存，但当前尚未解析，不能阅读'
                : 'MAP7E 自制书封 · 私人文件仅在本机保存'}
        </p>
        {book.source && (
          <section className="detail-contents" aria-label="书籍来源">
            <h2>版本与来源</h2>
            <p>
              来源：
              <a href={book.source.url} target="_blank" rel="noopener noreferrer">
                {book.source.name}
              </a>
            </p>
            <p>版本：{book.source.edition}</p>
            <p>版权状态：{book.source.copyright}</p>
            {book.source.translator && (
              <p>译者：{book.source.translator}</p>
            )}
            <p>作者：{book.author}</p>
          </section>
        )}
        {book.sourceType === 'private' && (
          <section className="detail-contents">
            <h2>书中的路</h2>
            {book.chapters.length ? (
              <>
                <p>{book.chapters.length} 个阅读分段 · 来自导入文件</p>
                <ol>
                  {book.chapters.slice(0, 8).map((chapter) => (
                    <li key={chapter.id}>{chapter.title}</li>
                  ))}
                </ol>
                {book.chapters.length > 8 && (
                  <p>其余章节可在阅读页目录查看。</p>
                )}
              </>
            ) : (
              <p>
                待导入私人文件后生成目录；尚未录入
                {book.edition || '当前版本'}
                正式目录。
              </p>
            )}
          </section>
        )}
      </section>
      {confirmRemove && (
        <Sheet
          title="移除已导入文件？"
          onClose={() => {
            if (!removing) setConfirmRemove(false)
          }}
        >
          <p className="import-intro">
            将移除这台设备中《{book.title}
            》的私人文件、正文和阅读位置。书籍条目保留，你设备上的原始文件不受影响。
          </p>
          {removeError && (
            <p role="alert" className="import-error">
              {removeError}
            </p>
          )}
          <button
            className="primary-button"
            disabled={removing}
            onClick={async () => {
              setRemoving(true)
              try {
                await onRemove()
                setConfirmRemove(false)
              } catch {
                setRemoveError(
                  '移除失败，原有文件和阅读位置保持不变，请重试。',
                )
              } finally {
                setRemoving(false)
              }
            }}
          >
            {removing ? '正在移除…' : '确认移除私人文件'}
          </button>
          <button
            className="text-button"
            disabled={removing}
            onClick={() => setConfirmRemove(false)}
          >
            保留文件
          </button>
        </Sheet>
      )}
    </main>
  )
}
