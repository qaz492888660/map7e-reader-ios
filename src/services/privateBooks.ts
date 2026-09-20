import type {
  PrivateBookRecord,
  ReadingPosition,
  StoredReadingPosition,
} from '../types/book'
const DB = 'map7e-private-library'
export function openLibrary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前浏览器无法使用本地书库存储。'))
      return
    }
    const request = indexedDB.open(DB, 1)
    let settled = false
    const timer = setTimeout(() => {
      settled = true
      reject(new Error('本地书库打开超时，请关闭其他书房标签页后重试。'))
    }, 5000)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('books', { keyPath: 'bookId' })
      db.createObjectStore('positions', { keyPath: 'bookId' })
    }
    request.onsuccess = () => {
      clearTimeout(timer)
      if (settled) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => {
      clearTimeout(timer)
      settled = true
      reject(request.error)
    }
    request.onblocked = () => {
      clearTimeout(timer)
      settled = true
      reject(new Error('请关闭其他书房标签页后重试。'))
    }
  })
}
export async function loadLibrary() {
  const db = await openLibrary()
  return new Promise<{
    records: PrivateBookRecord[]
    positions: (StoredReadingPosition & { bookId: string })[]
  }>((resolve, reject) => {
    const tx = db.transaction(['books', 'positions'], 'readonly')
    const records = tx.objectStore('books').getAll()
    const positions = tx.objectStore('positions').getAll()
    tx.oncomplete = () => {
      db.close()
      resolve({ records: records.result, positions: positions.result })
    }
    tx.onabort = tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('本地书库读取失败。'))
    }
  })
}
export async function storePrivateBook(record: PrivateBookRecord) {
  const db = await openLibrary()
  return new Promise<void>((resolve, reject) => {
    // File replacement and position reset are atomic. Failure keeps the old book.
    const tx = db.transaction(['books', 'positions'], 'readwrite')
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onabort = tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('保存失败，请检查浏览器剩余空间。'))
    }
    try {
      tx.objectStore('books').put(record)
      tx.objectStore('positions').delete(record.bookId)
    } catch (error) {
      // A synchronous cloning failure must also release the connection.
      tx.abort()
      db.close()
      reject(error)
    }
  })
}
export async function storePrivatePosition(
  bookId: string,
  position: ReadingPosition,
) {
  const db = await openLibrary()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['books', 'positions'], 'readwrite')
    const request = tx.objectStore('books').get(bookId)
    request.onsuccess = () => {
      // An old reader/tab must not overwrite the position of a replacement file.
      if (request.result?.revision === position.contentRevision)
        tx.objectStore('positions').put({ bookId, ...position })
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onabort = tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('阅读位置保存失败。'))
    }
  })
}

export async function removePrivateBook(bookId: string) {
  const db = await openLibrary()
  return new Promise<void>((resolve, reject) => {
    // Catalog metadata is bundled separately; remove only this private file and checkpoint.
    const tx = db.transaction(['books', 'positions'], 'readwrite')
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onabort = tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('移除失败，原有文件保持不变。'))
    }
    try {
      tx.objectStore('books').delete(bookId)
      tx.objectStore('positions').delete(bookId)
    } catch (error) {
      // Even a synchronous second request failure must roll back the first delete.
      tx.abort()
      db.close()
      reject(error)
    }
  })
}
