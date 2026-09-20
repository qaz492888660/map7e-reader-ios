import type { Book, Chapter, PrivateBookRecord } from '../types/book'
export const MAX_FILE_BYTES = 20 * 1024 * 1024
export type TextEncoding = 'utf-8' | 'gb18030' | 'utf-16le'
export function splitText(text: string): Chapter[] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  if (!normalized.trim())
    throw new Error('文件没有可阅读的文字，请选择其他文件。')
  if (/[\u0000-\u0008\u000e-\u001f]/.test(normalized))
    throw new Error('文件不像纯文本，或编码不正确。请更换编码再预览。')
  const chapters: Chapter[] = []
  let title = '正文'
  let paragraphs: string[] = []
  let size = 0
  const flush = () => {
    if (paragraphs.length)
      chapters.push({ id: `chapter-${chapters.length + 1}`, title, paragraphs })
    paragraphs = []
    size = 0
  }
  // Recognise plain-text chapter headings, never interpret HTML or executable markup.
  for (const raw of normalized.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (
      /^(?:第[零〇一二三四五六七八九十百千万两\d]+[章节卷部篇][\s　:：、.．]*.{0,60}|chapter\s+\d+(?:\s.{0,60})?)$/i.test(
        line,
      )
    ) {
      // Preserve empty headings too, without manufacturing any body paragraphs.
      if (!paragraphs.length && title !== '正文') paragraphs.push('')
      flush()
      title = line
    } else {
      // Bound a rendered section and individual paragraph for large unstructured TXT.
      for (let i = 0; i < line.length; ) {
        let end = Math.min(i + 1200, line.length)
        if (end < line.length && /[\uD800-\uDBFF]/.test(line[end - 1])) end--
        const paragraph = line.slice(i, end)
        i = end
        paragraphs.push(paragraph)
        size += paragraph.length
        if (size >= 14000) {
          flush()
          title = `${title.replace(/（续）$/, '')}（续）`
        }
      }
    }
  }
  if (!paragraphs.length && title !== '正文') paragraphs.push('')
  flush()
  if (!chapters.some((c) => c.paragraphs.some((p) => p.trim())))
    throw new Error('文件只有标题，没有正文。')
  if (chapters.length > 3000)
    throw new Error('分段过多，请整理章节标题后再导入。')
  return chapters
}
export async function prepareImport(
  book: Book,
  file: File,
  encoding: TextEncoding,
): Promise<PrivateBookRecord> {
  if (book.sourceType !== 'private') throw new Error('请选择私人书籍条目。')
  if (file.size === 0 || file.size > MAX_FILE_BYTES)
    throw new Error('请选择非空且不超过 20 MB 的文件。')
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'txt' && extension !== 'epub')
    throw new Error('目前只接受 TXT 或 EPUB 文件。')
  const bytes = await file.arrayBuffer()
  const revision = crypto.randomUUID()
  let content: PrivateBookRecord['content']
  if (extension === 'txt') {
    let text: string
    try {
      text = new TextDecoder(encoding, { fatal: true }).decode(bytes)
    } catch {
      throw new Error(
        '文字解码失败，请选择 UTF-8、GB18030 或 UTF-16LE 后重试。',
      )
    }
    const chapters = splitText(text)
    content = { bookId: book.id, revision, format: 'txt', chapters }
  } else {
    const header = new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength))
    if (
      header[0] !== 0x50 ||
      header[1] !== 0x4b ||
      header[2] !== 3 ||
      header[3] !== 4
    )
      throw new Error('文件不是可识别的 EPUB/ZIP 容器。')
    // Container signature is only a sanity check, not an EPUB validation/parser.
  }
  return {
    bookId: book.id,
    revision,
    file,
    filename: file.name,
    format: extension,
    importedAt: Date.now(),
    content,
    metadata: {
      ...book,
      availability: content ? 'ready' : 'stored',
      readingProgress: 0,
      chapters: content?.chapters.map(({ id, title }) => ({ id, title })) || [],
      learningStatus: 'not-started',
    },
  }
}
