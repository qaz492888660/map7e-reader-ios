import type { ContentAnchor } from '../types/book'
export const COLUMN_GAP = 32
export const compareAnchors = (a: ContentAnchor, b: ContentAnchor) =>
  a.paragraphIndex - b.paragraphIndex ||
  a.characterOffset - b.characterOffset
export function pageForAnchor(
  pages: ContentAnchor[],
  anchor: ContentAnchor,
) {
  if (!anchor.paragraphIndex && !anchor.characterOffset) return 0
  let low = 0,
    high = pages.length - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (compareAnchors(pages[middle], anchor) <= 0) low = middle
    else high = middle - 1
  }
  return low
}
// CSS performs line wrapping and fragmentation. Ranges map the resulting columns
// back to the original text; no characters-per-page estimate is used here.
export function measurePages(
  article: HTMLElement,
  width: number,
  toSourceOffset: (
    paragraphIndex: number,
    displayOffset: number,
  ) => number = (_paragraphIndex, displayOffset) => displayOffset,
): ContentAnchor[] {
  const stride = width + COLUMN_GAP
  const count = Math.max(
    1,
    Math.ceil((article.scrollWidth + COLUMN_GAP - 1) / stride),
  )
  const paragraphs = Array.from(
    article.querySelectorAll<HTMLElement>('[data-paragraph]'),
  )
  const origin = article.getBoundingClientRect().left
  const range = document.createRange()
  const charPage = (index: number, offset: number) => {
    const p = paragraphs[index],
      text = p.firstChild
    if (!text || !text.textContent?.length) {
      const rect = p.getClientRects()[0]
      return rect
        ? Math.max(0, Math.floor((rect.left - origin + 1) / stride))
        : 0
    }
    const start = Math.min(offset, text.textContent.length - 1)
    range.setStart(text, start)
    range.setEnd(text, start + 1)
    const rect = range.getClientRects()[0]
    if (!rect) return 0
    return Math.max(0, Math.floor((rect.left - origin + 1) / stride))
  }
  const pages: ContentAnchor[] = [{ paragraphIndex: 0, characterOffset: 0 }]
  for (let page = 1; page < count; page++) {
    let low = 0,
      high = paragraphs.length - 1
    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      if (
        charPage(
          mid,
          Math.max(0, (paragraphs[mid].textContent?.length || 0) - 1),
        ) < page
      )
        low = mid + 1
      else high = mid
    }
    const paragraphIndex = Math.max(0, low)
    const text = paragraphs[paragraphIndex]?.textContent || ''
    low = 0
    high = text.length
    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      if (charPage(paragraphIndex, mid) < page) low = mid + 1
      else high = mid
    }
    if (low > 0 && /[\uDC00-\uDFFF]/.test(text[low] || '')) low--
    pages.push({
      paragraphIndex,
      characterOffset: toSourceOffset(paragraphIndex, low),
    })
  }
  return pages
}
