import { useEffect, useLayoutEffect, useState } from 'react'
import { books as catalog, bundledContent } from './data/catalog'
import { usePage } from './hooks/usePage'
import { useReaderState } from './hooks/useReaderState'
import { usePrivateLibrary } from './hooks/usePrivateLibrary'
import type { Book, ReadingPosition } from './types/book'
import {
  positionAtProgress,
  readingProgress,
  resolvePosition,
} from './services/readingPosition'
import Home from './components/reader/Home'
import Library from './components/reader/Library'
import BookDetail from './components/reader/BookDetail'
import Reader from './components/reader/Reader'
import PageHeader from './components/reader/PageHeader'
import MissingBook from './components/reader/MissingBook'
import ImportBook from './components/reader/ImportBook'
import { ReadingHistory, Settings } from './components/reader/PersonalPages'
import OceanBackground from './components/reader/OceanBackground'
import ScenicBackground from './components/reader/ScenicBackground'

export default function App() {
  const { page, navigate, back } = usePage()
  const saved = useReaderState()
  const privateLibrary = usePrivateLibrary()
  const { settings, setSettings } = saved
  useLayoutEffect(() => {
    const readerSurfaces = {
      paper: '#f5f1e8',
      white: '#fcfcfa',
      night: '#202b30',
    } as const
    const inReader = page.name === 'reader'
    const ambienceChrome = {
      sky: '#9ccfe5',
      ocean: '#143f55',
      shanhai: '#78989a',
      night: '#0b1420',
    } as const
    const previewAmbience =
      page.name === 'home' || page.name === 'settings'
        ? settings.ambience
        : 'sky'
    const color = inReader
      ? settings.ambience === 'night'
        ? ambienceChrome.night
        : readerSurfaces[settings.theme]
      : ambienceChrome[previewAmbience]
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', color)
    if (inReader) {
      document.documentElement.dataset.readerSurface = settings.theme
      if (settings.ambience === 'night')
        document.documentElement.dataset.ambience = 'night'
      else delete document.documentElement.dataset.ambience
    } else {
      delete document.documentElement.dataset.readerSurface
      document.documentElement.dataset.ambience = previewAmbience
    }
  }, [page.name, settings.theme, settings.ambience])
  const books = catalog.map((book) =>
    book.sourceType === 'private' && privateLibrary.records[book.id]
      ? {
          ...book,
          availability:
            privateLibrary.records[book.id].metadata.availability,
          chapters: privateLibrary.records[book.id].metadata.chapters,
        }
      : book,
  )
  const contentFor = (book: Book) =>
    book.sourceType === 'private'
      ? privateLibrary.records[book.id]?.content
      : bundledContent[book.id]
  const positions: Record<string, ReadingPosition> = {}
  for (const book of books) {
    const content = contentFor(book)
    const valid = [
      saved.positions[book.id],
      privateLibrary.positions[book.id],
    ]
      .filter(
        (p) =>
          p &&
          content &&
          (book.sourceType === 'demo' ||
            p.contentRevision === content.revision),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
    if (valid[0] && content)
      positions[book.id] = resolvePosition(content, valid[0])
  }
  const [libraryBook, setLibraryBook] = useState(catalog[0].id)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [importingId, setImporting] = useState<string | null>(null)
  const selected =
    'bookId' in page ? books.find((b) => b.id === page.bookId) : undefined
  const importing = books.find((b) => b.id === importingId)
  const recent =
    books
      .filter((b) => positions[b.id])
      .sort(
        (a, b) => positions[b.id].updatedAt - positions[a.id].updatedAt,
      )[0] || books[0]
  function progress(book: Book) {
    const position = positions[book.id]
    const content = contentFor(book)
    return position && content?.chapters.length
      ? readingProgress(content, position)
      : book.readingProgress
  }
  function savePosition(book: Book, p: ReadingPosition) {
    saved.savePosition(book.id, p)
    if (book.sourceType === 'private')
      privateLibrary.savePosition(book.id, p)
  }
  const open = (book: Book) => navigate({ name: 'book', bookId: book.id })
  function read(book: Book, restart = false) {
    const content = contentFor(book)
    if (!content?.chapters.length) {
      navigate({ name: 'reader', bookId: book.id })
      return
    }
    if (restart || !positions[book.id]) {
      savePosition(
        book,
        positionAtProgress(
          content,
          restart || book.readingProgress >= 1 ? 0 : book.readingProgress,
        ),
      )
    }
    navigate({ name: 'reader', bookId: book.id })
  }
  useEffect(() => {
    document.title = `${selected ? selected.title + ' · ' : ''}MAP7E Reader`
    window.scrollTo(0, 0)
    document
      .querySelector<HTMLElement>('h1')
      ?.focus({ preventScroll: true })
    setImporting(null)
  }, [page.name, selected?.id])
  const selectedContent = selected && contentFor(selected)
  const loading =
    selected?.sourceType === 'private' && privateLibrary.loading
  const error =
    selected?.sourceType === 'private' ? privateLibrary.error : ''
  return (
    <>
      {page.name === 'reader' && selected ? (
        selectedContent?.chapters.length ? (
          <Reader
            key={`${selected.id}:${selectedContent.revision}`}
            book={selected}
            content={selectedContent}
            position={positions[selected.id]}
            settings={settings}
            onSettings={setSettings}
            onPosition={(p) => savePosition(selected, p)}
            onBack={back}
            storageError={saved.storageError || !!error}
          />
        ) : (
          <MissingBook
            book={selected}
            settings={settings}
            loading={!!loading}
            error={error}
            onImport={() => setImporting(selected.id)}
            onRetry={privateLibrary.retry}
            onSettings={() => navigate({ name: 'settings' })}
            onBack={back}
          />
        )
      ) : (
        <div
          className={`reading-space ${settings.motion ? '' : 'motion-paused'} ambience-${
            page.name === 'home' || page.name === 'settings'
              ? settings.ambience
              : 'sky'
          }`}
        >
          {(page.name === 'home' || page.name === 'settings'
            ? settings.ambience
            : 'sky') === 'ocean' ? (
            <OceanBackground motion={settings.motion} variant="space" />
          ) : (
            <ScenicBackground
              key={page.name === 'home' || page.name === 'settings' ? settings.ambience : 'sky'}
              scene={
                (page.name === 'home' || page.name === 'settings'
                  ? settings.ambience
                  : 'sky') as 'sky' | 'shanhai' | 'night'
              }
              motion={settings.motion}
              variant="space"
            />
          )}
          <div className="space-content">
            {page.name === 'home' && (
              <Home
                onNavigate={(name) => navigate({ name })}
                resume={recent}
                progress={progress(recent)}
                hasPosition={!!positions[recent.id]}
                onResume={() =>
                  positions[recent.id] ? read(recent) : open(recent)
                }
                ambience={settings.ambience}
              />
            )}
            {page.name === 'library' && (
              <Library
                books={books}
                selectedId={libraryBook}
                onSelect={setLibraryBook}
                onOpen={open}
                onBack={back}
                motion={settings.motion}
                query={query}
                category={category}
                onQuery={setQuery}
                onCategory={setCategory}
                onSettings={() => navigate({ name: 'settings' })}
              />
            )}
            {page.name === 'book' && selected && (
              <BookDetail
                book={selected}
                progress={progress(selected)}
                onBack={back}
                onRead={() => read(selected, progress(selected) >= 1)}
                onImport={() => setImporting(selected.id)}
                loading={!!loading}
                error={error}
                onRetry={privateLibrary.retry}
                onSettings={() => navigate({ name: 'settings' })}
                onRemove={async () => {
                  await privateLibrary.removeRecord(selected.id)
                  saved.removePosition(selected.id)
                }}
              />
            )}
            {page.name === 'history' && (
              <ReadingHistory
                books={books}
                positions={positions}
                progress={progress}
                onOpen={open}
                onBack={back}
                onSettings={() => navigate({ name: 'settings' })}
              />
            )}
            {page.name === 'settings' && (
              <Settings
                settings={settings}
                onSettings={setSettings}
                onBack={back}
                storageError={saved.storageError}
              />
            )}
            {'bookId' in page && !selected && (
              <main className="page">
                <PageHeader title="书籍未找到" onBack={back} />
                <div className="empty-state">
                  <h1 tabIndex={-1}>这本书不在书架上。</h1>
                  <button
                    className="primary-button"
                    onClick={() => navigate({ name: 'library' }, true)}
                  >
                    回到书库
                  </button>
                </div>
              </main>
            )}
            {saved.storageError && page.name !== 'settings' && (
              <p className="storage-notice" role="status">
                浏览器暂时无法保存进度检查点，本次阅读仍可继续。
              </p>
            )}
          </div>
        </div>
      )}
      {importing && (
        <ImportBook
          key={importing.id}
          book={importing}
          onClose={() => setImporting(null)}
          onSave={async (record) => {
            await privateLibrary.importRecord(record)
            if (record.content) {
              savePosition(importing, {
                paragraphIndex: 0,
                characterOffset: 0,
                chapterId: record.content.chapters[0].id,
                updatedAt: Date.now(),
                contentRevision: record.revision,
              })
              navigate({ name: 'reader', bookId: record.bookId })
            }
          }}
        />
      )}
    </>
  )
}
