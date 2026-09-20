import { useEffect, useState } from 'react'
import type {
  PrivateBookRecord,
  ReadingPosition,
  StoredReadingPosition,
} from '../types/book'
import {
  loadLibrary,
  removePrivateBook,
  storePrivateBook,
  storePrivatePosition,
} from '../services/privateBooks'
export function usePrivateLibrary() {
  const [records, setRecords] = useState<Record<string, PrivateBookRecord>>(
    {},
  )
  const [positions, setPositions] = useState<
    Record<string, StoredReadingPosition>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    loadLibrary()
      .then((data) => {
        if (!active) return
        setRecords(
          Object.fromEntries(data.records.map((r) => [r.bookId, r])),
        )
        setPositions(
          Object.fromEntries(data.positions.map((p) => [p.bookId, p])),
        )
        setError('')
      })
      .catch(() => {
        if (active)
          setError('暂时无法打开本地书库，请重试。已有文件不会被覆盖。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt])
  return {
    records,
    positions,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1),
    importRecord: async (record: PrivateBookRecord) => {
      await storePrivateBook(record)
      setRecords((old) => ({ ...old, [record.bookId]: record }))
      setPositions((old) => {
        const next = { ...old }
        delete next[record.bookId]
        return next
      })
      setError('')
    },
    removeRecord: async (bookId: string) => {
      await removePrivateBook(bookId)
      setRecords((old) => {
        const next = { ...old }
        delete next[bookId]
        return next
      })
      setPositions((old) => {
        const next = { ...old }
        delete next[bookId]
        return next
      })
      setError('')
    },
    savePosition: (bookId: string, position: ReadingPosition) => {
      setPositions((old) => ({ ...old, [bookId]: position }))
      void storePrivatePosition(bookId, position).catch(() =>
        setError(
          '正文仍在本机，但阅读位置暂时未写入书库；请勿清除浏览器数据。',
        ),
      )
    },
  }
}
