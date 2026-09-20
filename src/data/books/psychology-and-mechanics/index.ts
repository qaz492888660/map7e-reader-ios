import type { Book, BookContent } from '../../../types/book'
import { chapters } from './chapters'

export const mechanicsBook: Book = {
  id: 'psychology-and-mechanics',
  title: '心理与力学',
  author: '李宗吾',
  edition: '1942年',
  category: '心理学 · 心理思想',
  description: '李宗吾《心理與力學》的 1942 年版，按原书的序、自序与十一章编排。',
  cover: { color: '#9a806a', dark: '#4f4c48', motif: 2 },
  readingProgress: 0,
  sourceType: 'bundled',
  availability: 'ready',
  chapters: chapters.map(({ id, title }) => ({ id, title })),
  learningStage: '心理学拓展阅读',
  tags: ['公版 · 可直接阅读'],
  source: {
    name: '维基文库',
    url: 'https://zh.wikisource.org/wiki/心理與力學',
    edition: '1942年',
    copyright: '公有领域（维基文库标注：美国及作者终身加80年以下地区）',
  },
}

export const mechanicsContent: BookContent = {
  bookId: mechanicsBook.id,
  revision: 'wikisource-mechanics-1942-v1',
  format: 'public-domain',
  chapters,
}
