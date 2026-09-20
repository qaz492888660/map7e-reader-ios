import OpenCC from 'opencc-js'
import type { ReaderSettings } from '../types/book'

const toSimplified = OpenCC.Converter({ from: 't', to: 'cn' })
const toTraditional = OpenCC.Converter({ from: 'cn', to: 't' })

export function convertText(
  text: string,
  script: ReaderSettings['script'],
): string {
  if (script === 'simplified') return toSimplified(text)
  if (script === 'traditional') return toTraditional(text)
  return text
}

function snapUtf16Offset(text: string, offset: number) {
  let value = Math.max(0, Math.min(text.length, Math.floor(offset)))
  if (
    value > 0 &&
    value < text.length &&
    /[\uDC00-\uDFFF]/.test(text[value])
  )
    value--
  return value
}

// Pagination measures the rendered (possibly converted) text, while saved
// anchors always stay in the untouched source text. OpenCC conversions are
// normally length-preserving; the proportional fallback covers rare
// phrase-level length changes without ever rewriting BookContent.
export function displayOffsetToSource(
  source: string,
  displayed: string,
  displayOffset: number,
) {
  if (!source.length || !displayed.length) return 0
  const visible = Math.max(
    0,
    Math.min(displayed.length, Math.floor(displayOffset)),
  )
  if (source.length === displayed.length)
    return snapUtf16Offset(source, visible)
  return snapUtf16Offset(
    source,
    Math.round((visible / displayed.length) * source.length),
  )
}
