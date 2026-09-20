import type { Book, BookContent } from '../../../types/book'
import { chapters } from './chapters'

export const crowdBook: Book = {
  id: 'crowd-psychology-1920',
  title: '群众心理',
  author: 'Gustave Le Bon（黎朋）',
  edition: '1920年中文译本',
  category: '心理学 · 社会心理',
  description: '吴旭初、杜师业于 1920 年翻译的《羣衆心理》，按维基文库所收原序、导言和三篇各章阅读。',
  cover: { color: '#778f8d', dark: '#41535c', motif: 1 },
  readingProgress: 0,
  sourceType: 'bundled',
  availability: 'ready',
  chapters: chapters.map(({ id, title }) => ({ id, title })),
  learningStage: '心理学拓展阅读',
  tags: ['公版 · 可直接阅读'],
  source: {
    name: '维基文库',
    url: 'https://zh.wikisource.org/wiki/羣衆心理',
    edition: '1920年中文译本',
    translator: '吴旭初、杜师业',
    copyright: '公有领域（维基文库标注：美国及作者终身加80年以下地区）',
  },
}

export const crowdContent: BookContent = {
  bookId: crowdBook.id,
  revision: 'wikisource-crowd-1920-v1',
  format: 'public-domain',
  chapters,
}
