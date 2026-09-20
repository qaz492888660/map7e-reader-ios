export interface ChapterSummary {
  id: string
  title: string
}
export interface Book {
  id: string
  title: string
  author: string
  edition?: string
  category: string
  description: string
  cover: { color: string; dark: string; motif: number; imageUrl?: string }
  readingProgress: number
  sourceType: 'demo' | 'private' | 'bundled'
  source?: {
    name: string
    url: string
    edition: string
    copyright: string
    translator?: string
  }
  availability: 'missing' | 'ready' | 'stored'
  chapters: ChapterSummary[]
  learningStage?: string
  tags?: string[]
  notesCount?: number
  learningStatus?: 'not-started' | 'learning' | 'completed'
}
export interface Chapter extends ChapterSummary {
  paragraphs: string[]
}
export interface BookContent {
  bookId: string
  revision: string
  format: 'demo' | 'txt' | 'public-domain'
  chapters: Chapter[]
}
export interface LegacyReadingPosition {
  chapter: number
  chapterId?: string
  fraction: number
  updatedAt: number
  contentRevision?: string
}
export interface ContentAnchor {
  paragraphIndex: number
  characterOffset: number
}
export interface ReadingPosition extends ContentAnchor {
  chapterId: string
  contentRevision: string
  updatedAt: number
  completed?: boolean
}
// Read old checkpoints once, then write only stable content anchors.
export type StoredReadingPosition = ReadingPosition | LegacyReadingPosition
export interface PrivateBookRecord {
  bookId: string
  metadata: Book
  file: Blob
  filename: string
  format: 'txt' | 'epub'
  revision: string
  importedAt: number
  content?: BookContent
}
export interface ReaderSettings {
  fontSize: number
  fontFamily: 'serif' | 'sans'
  theme: 'paper' | 'white' | 'night'
  lineHeight: number
  pageMargin: number
  script: 'original' | 'simplified' | 'traditional'
  ambience: 'sky' | 'ocean' | 'shanhai' | 'night'
  motion: boolean
}
