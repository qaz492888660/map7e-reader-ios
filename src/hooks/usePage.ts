import { useEffect, useState } from 'react'
export type Page =
  | { name: 'home' | 'library' | 'history' | 'settings' }
  | { name: 'book' | 'reader'; bookId: string }
export function parsePage(hash: string): Page {
  const [name, rawId] = hash.replace(/^#\/?/, '').split('/')
  if (name === 'book' || name === 'reader') {
    try {
      if (rawId) return { name, bookId: decodeURIComponent(rawId) }
    } catch {
      /* malformed link returns home */
    }
  }
  return {
    name:
      name === 'library' || name === 'history' || name === 'settings'
        ? name
        : 'home',
  }
}
export function usePage() {
  const [page, setPage] = useState(() => parsePage(location.hash))
  useEffect(() => {
    const update = () => setPage(parsePage(location.hash))
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])
  function navigate(next: Page, replace = false) {
    const hash = `#/${next.name}${'bookId' in next ? `/${encodeURIComponent(next.bookId)}` : ''}`
    if (location.hash === hash) return
    if (replace) history.replaceState(history.state, '', hash)
    else history.pushState({ map7e: true }, '', hash)
    setPage(next)
  }
  return {
    page,
    navigate,
    back: () =>
      history.state?.map7e ? history.back() : navigate({ name: 'home' }, true),
  }
}
