import type { Book, ReaderSettings } from '../../types/book'
import PageHeader from './PageHeader'
import Icon from './Icon'
export default function MissingBook({
  book,
  settings,
  loading,
  error,
  onImport,
  onRetry,
  onBack,
  onSettings,
}: {
  book: Book
  settings: ReaderSettings
  loading: boolean
  error: string
  onImport: () => void
  onRetry: () => void
  onBack: () => void
  onSettings: () => void
}) {
  return (
    <main className={`reader missing-reader theme-${settings.theme}`}>
      <PageHeader
        title={book.title}
        onBack={onBack}
        onSettings={onSettings}
        note={book.edition}
      />
      <section className="missing-content">
        <Icon name="book" />
        <div className="eyebrow">{book.tags?.[0] || '私人藏书'}</div>
        <h1 tabIndex={-1}>
          {loading
            ? '正在打开本地书库'
            : error
              ? '暂时无法读取本地书库'
              : '正文文件尚未导入'}
        </h1>
        <p>
          {error ||
            (book.availability === 'stored'
              ? 'EPUB 文件已保存在本机，但当前尚未解析，不能阅读。你可以改为导入 TXT 开始阅读。'
              : '这里为你的学习留了一个位置。导入有权使用的私人文件后，再从第一章开始。')}
        </p>
        {!loading &&
          (error ? (
            <button className="primary-button" onClick={onRetry}>
              重试打开书库
            </button>
          ) : (
            <button className="primary-button" onClick={onImport}>
              导入私人书籍文件
            </button>
          ))}
        <small>目录将在导入后生成；此处没有教材原文或替代正文。</small>
      </section>
    </main>
  )
}
