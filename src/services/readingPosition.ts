import type {
  BookContent,
  ContentAnchor,
  ReadingPosition,
  StoredReadingPosition,
} from '../types/book'
const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Number.isFinite(n) ? Math.floor(n) : 0))
export function clampAnchor(
  paragraphs: string[],
  anchor: ContentAnchor,
): ContentAnchor {
  const paragraphIndex = clamp(
    anchor.paragraphIndex,
    Math.max(0, paragraphs.length - 1),
  )
  const text = paragraphs[paragraphIndex] || ''
  let characterOffset = clamp(anchor.characterOffset, text.length)
  // A DOM text offset uses UTF-16 code units; never restore inside a surrogate pair.
  if (
    characterOffset > 0 &&
    characterOffset < text.length &&
    /[\uDC00-\uDFFF]/.test(text[characterOffset])
  )
    characterOffset--
  return { paragraphIndex, characterOffset }
}
export function anchorAtOffset(
  paragraphs: string[],
  offset: number,
): ContentAnchor {
  let remaining = Math.max(0, offset)
  for (let i = 0; i < paragraphs.length; i++) {
    if (remaining < paragraphs[i].length || i === paragraphs.length - 1)
      return clampAnchor(paragraphs, {
        paragraphIndex: i,
        characterOffset: remaining,
      })
    remaining -= paragraphs[i].length
  }
  return { paragraphIndex: 0, characterOffset: 0 }
}
const lengthsCache = new WeakMap<BookContent, number[]>()
function lengths(content: BookContent) {
  let result = lengthsCache.get(content)
  if (!result) {
    result = content.chapters.map((c) =>
      c.paragraphs.reduce((n, p) => n + p.length, 0),
    )
    lengthsCache.set(content, result)
  }
  return result
}
export function resolvePosition(
  content: BookContent,
  raw?: StoredReadingPosition,
): ReadingPosition {
  let index = content.chapters.findIndex((c) => c.id === raw?.chapterId)
  const legacy = raw && 'fraction' in raw ? raw : undefined
  if (index < 0)
    index = clamp(
      legacy?.chapter || 0,
      Math.max(0, content.chapters.length - 1),
    )
  const chapter = content.chapters[index]
  const validRevision =
    !raw?.contentRevision || raw.contentRevision === content.revision
  if (!validRevision) return resolvePosition(content)
  const anchor =
    raw && 'paragraphIndex' in raw
      ? clampAnchor(chapter.paragraphs, raw)
      : anchorAtOffset(
          chapter.paragraphs,
          (legacy?.fraction || 0) * lengths(content)[index],
        )
  return {
    ...anchor,
    chapterId: chapter.id,
    contentRevision: content.revision,
    updatedAt: raw?.updatedAt || Date.now(),
    completed: !!(raw && 'completed' in raw && raw.completed),
  }
}
export function positionAtProgress(
  content: BookContent,
  fraction: number,
): ReadingPosition {
  const sizes = lengths(content)
  let offset =
    Math.max(0, Math.min(1, fraction)) * sizes.reduce((a, b) => a + b, 0)
  let index = 0
  while (index < sizes.length - 1 && offset >= sizes[index])
    offset -= sizes[index++]
  return {
    ...anchorAtOffset(content.chapters[index].paragraphs, offset),
    chapterId: content.chapters[index].id,
    contentRevision: content.revision,
    updatedAt: Date.now(),
  }
}
export function readingProgress(
  content: BookContent,
  raw: StoredReadingPosition,
): number {
  const position = resolvePosition(content, raw)
  if (position.completed) return 1
  const index = content.chapters.findIndex(
    (c) => c.id === position.chapterId,
  )
  const sizes = lengths(content)
  const before = sizes.slice(0, index).reduce((a, b) => a + b, 0)
  const inside =
    content.chapters[index].paragraphs
      .slice(0, position.paragraphIndex)
      .reduce((n, p) => n + p.length, 0) + position.characterOffset
  return Math.min(
    1,
    (before + inside) /
      Math.max(
        1,
        sizes.reduce((a, b) => a + b, 0),
      ),
  )
}
