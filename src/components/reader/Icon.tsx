import type { CSSProperties } from 'react'
export type IconName =
  | 'leaf'
  | 'book'
  | 'arrow'
  | 'back'
  | 'history'
  | 'settings'
  | 'close'
  | 'sun'
  | 'menu'
  | 'search'
const paths: Record<IconName, string> = {
  leaf: 'M12 2 9 8 5 6 6 11 2 12 7 16 6 19 11 18 11 22 M12 2 15 8 19 6 18 11 22 12 17 16 18 19 13 18 11 22 M12 9 12 17',
  book: 'M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v15',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  history: 'M4 5v5h5 M4 10a8 8 0 1 1 1 7 M12 7v5l3 2',
  settings: 'M5 3v18M12 3v18M19 3v18 M2 8h6 M9 16h6 M16 7h6',
  close: 'm6 6 12 12M6 18 18 6',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'm16 16 5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
}
export default function Icon({
  name,
  style,
}: {
  name: IconName
  style?: CSSProperties
}) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  )
}
