import { useRef, useState } from 'react'
import type { Book, PrivateBookRecord } from '../../types/book'
import { prepareImport, type TextEncoding } from '../../services/importBook'
import Sheet from './Sheet'
export default function ImportBook({
  book,
  onSave,
  onClose,
}: {
  book: Book
  onSave: (record: PrivateBookRecord) => Promise<void>
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [encoding, setEncoding] = useState<TextEncoding>('utf-8')
  const [prepared, setPrepared] = useState<PrivateBookRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const serial = useRef(0)
  async function preview(
    nextFile: File | null,
    nextEncoding: TextEncoding,
  ) {
    const ticket = ++serial.current
    setFile(nextFile)
    setEncoding(nextEncoding)
    setPrepared(null)
    setError('')
    if (!nextFile) return
    setBusy(true)
    try {
      const record = await prepareImport(book, nextFile, nextEncoding)
      if (ticket === serial.current) setPrepared(record)
    } catch (e) {
      if (ticket === serial.current)
        setError(e instanceof Error ? e.message : '无法读取该文件。')
    } finally {
      if (ticket === serial.current) setBusy(false)
    }
  }
  return (
    <Sheet
      title="导入私人书籍文件"
      onClose={() => {
        if (!busy) {
          serial.current++
          onClose()
        }
      }}
    >
      <p className="import-intro">
        为《{book.title}》{book.edition}
        添加你有权使用的文件。只保存在这台设备，不上传到网站或 GitHub。
      </p>
      <input
        ref={fileRef}
        className="file-input"
        type="file"
        accept=".txt,.epub,text/plain,application/epub+zip"
        aria-label="选择私人书籍文件"
        disabled={busy}
        onChange={(e) =>
          void preview(e.target.files?.[0] || null, encoding)
        }
      />
      <button
        className="primary-button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        选择 TXT / EPUB 文件
      </button>
      <label className="encoding-field">
        TXT 编码
        <select
          aria-label="TXT 编码"
          value={encoding}
          disabled={busy}
          onChange={(e) =>
            void preview(file, e.target.value as TextEncoding)
          }
        >
          <option value="utf-8">UTF-8</option>
          <option value="gb18030">GB18030 / GBK</option>
          <option value="utf-16le">UTF-16LE</option>
        </select>
      </label>
      <p className="import-hint">
        TXT 可阅读；EPUB 只保存文件，尚未解析，不能阅读。PDF
        暂不支持，不提供 OCR。单个文件最多 20 MB。
      </p>
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
      {busy && <p role="status">正在处理文件，请稍候…</p>}
      {prepared && (
        <section className="import-preview">
          <h3>{prepared.filename}</h3>
          {prepared.content ? (
            <>
              <p>
                {prepared.content.chapters.length} 个阅读分段 ·
                请核对是否为你要导入的书
              </p>
              <blockquote>
                {prepared.content.chapters[0].paragraphs
                  .join('\n')
                  .slice(0, 300)}
              </blockquote>
              <p>目录按文件中的标题生成；自动分段不等于教材正式目录。</p>
            </>
          ) : (
            <p>EPUB 将保存在本机。正文仍显示未导入，等待后续解析支持。</p>
          )}
          {book.availability !== 'missing' && (
            <p className="import-warning">
              确认后将替换已有私人文件，并重置这本书的阅读位置。
            </p>
          )}
          <button
            className="primary-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await onSave(prepared)
                onClose()
              } catch {
                setError(
                  '保存失败：本地存储不可用或空间不足。原有文件保持不变，请重试。',
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            {prepared.content ? '确认导入并开始阅读' : '仅保存 EPUB 文件'}
          </button>
        </section>
      )}
    </Sheet>
  )
}
