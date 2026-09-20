import { useRef, useState } from 'react'
import type {
  ReaderSettings,
  ReadingPosition,
  StoredReadingPosition,
} from '../types/book'

const KEY = 'map7e-reader:v1'
const defaults: ReaderSettings = {
  fontSize: 19,
  fontFamily: 'serif',
  theme: 'paper',
  lineHeight: 1.85,
  pageMargin: 26,
  script: 'original',
  ambience: 'sky',
  motion: true,
}
function readSaved() {
  const empty = {
    positions: {} as Record<string, StoredReadingPosition>,
    settings: defaults,
  }
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!value || typeof value !== 'object') return empty
    const positions: Record<string, StoredReadingPosition> = {}
    for (const [id, raw] of Object.entries(value.positions || {})) {
      const p = raw as StoredReadingPosition | null
      if (
        p &&
        (('paragraphIndex' in p &&
          typeof p.chapterId === 'string' &&
          typeof p.contentRevision === 'string' &&
          Number.isInteger(p.paragraphIndex) &&
          p.paragraphIndex >= 0 &&
          Number.isInteger(p.characterOffset) &&
          p.characterOffset >= 0) ||
          ('chapter' in p &&
            Number.isInteger(p.chapter) &&
            p.chapter >= 0 &&
            Number.isFinite(p.fraction) &&
            p.fraction >= 0 &&
            p.fraction <= 1)) &&
        Number.isFinite(p.updatedAt)
      )
        positions[id] = p
    }
    const s = value.settings || {}
    return {
      positions,
      settings: {
        fontSize: [17, 19, 21, 23, 25].includes(s.fontSize)
          ? s.fontSize
          : defaults.fontSize,
        fontFamily:
          s.fontFamily === 'sans' ? ('sans' as const) : ('serif' as const),
        theme: ['paper', 'white', 'night'].includes(s.theme)
          ? (s.theme as ReaderSettings['theme'])
          : defaults.theme,
        lineHeight: [1.65, 1.85, 2.05].includes(s.lineHeight)
          ? s.lineHeight
          : defaults.lineHeight,
        pageMargin: [18, 26, 34].includes(s.pageMargin)
          ? s.pageMargin
          : defaults.pageMargin,
        script: ['original', 'simplified', 'traditional'].includes(s.script)
          ? (s.script as ReaderSettings['script'])
          : defaults.script,
        ambience: ['sky', 'ocean', 'shanhai', 'night'].includes(s.ambience)
          ? (s.ambience as ReaderSettings['ambience'])
          : defaults.ambience,
        motion: typeof s.motion === 'boolean' ? s.motion : true,
      },
    }
  } catch {
    return empty
  }
}

export function useReaderState() {
  const [saved, setSaved] = useState(readSaved)
  const [storageError, setStorageError] = useState(false)
  const latest = useRef(saved)
  function save(next: typeof saved) {
    latest.current = next
    setSaved(next)
    // Write synchronously so pagehide/unmount also preserve the last reading position.
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }
  return {
    ...saved,
    storageError,
    setSettings: (settings: ReaderSettings) =>
      save({ ...latest.current, settings }),
    removePosition: (id: string) => {
      const positions = { ...latest.current.positions }
      delete positions[id]
      save({ ...latest.current, positions })
    },
    savePosition: (id: string, position: ReadingPosition) =>
      save({
        ...latest.current,
        positions: { ...latest.current.positions, [id]: position },
      }),
  }
}
