import type { Book } from '../../../types/book'
import { chapters } from './chapters'
// Bibliographic fields supplied by the user. The description is a personal
// learning intention, not a quote or claim about this edition's contents.
export const metadata: Book = {
  id: 'general-psychology-6',
  title: '普通心理学',
  edition: '第6版',
  author: '彭聃龄、陈宝国',
  category: '心理学 · 基础',
  description:
    '从心理学基础开始，为理解人的心理与行为建立系统的知识框架。这是枫的第一本心理学学习书；在进入社交与商业场景之前，先把基础慢慢读扎实。',
  cover: { color: '#557c77', dark: '#284e50', motif: 3 },
  readingProgress: 0,
  sourceType: 'private',
  availability: 'missing',
  chapters,
  learningStage: '心理学专业学习 · 第一阶段',
  tags: ['第一本 · 心理学基础'],
  notesCount: 0,
  learningStatus: 'not-started',
}
