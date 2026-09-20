import { library } from './mockLibrary'
import type { Book } from '../types/book'
import { demoContent } from './books/demo'
import { psychologyBook } from './books/psychology-general'
import { crowdBook, crowdContent } from './books/crowd-psychology-1920'
import { mechanicsBook, mechanicsContent } from './books/psychology-and-mechanics'

const demoBooks: Book[] = library.flatMap((shelf, shelfIndex) =>
  shelf.books.map((book, index) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    category: shelf.label,
    description: `收在「${shelf.label}」中的一本书。这是演示藏书，简介和正文均为占位内容。`,
    cover: {
      color: book.spineColor,
      dark: book.spineDark,
      motif: (index + shelfIndex) % 3,
    },
    readingProgress: book.readingProgress,
    sourceType: 'demo' as const,
    availability: 'ready' as const,
    chapters: demoContent(book.id).chapters.map(({ id, title }) => ({
      id,
      title,
    })),
  })),
)
export const books: Book[] = [psychologyBook, crowdBook, mechanicsBook, ...demoBooks]
// Content resolution is explicitly keyed by book ID. Missing private books never
// fall back to a different book's demonstration text.
export const bundledContent = {
  [crowdBook.id]: crowdContent,
  [mechanicsBook.id]: mechanicsContent,
  ...Object.fromEntries(demoBooks.map((book) => [book.id, demoContent(book.id)])),
}
