import type { Book } from '../../types/book'
import BookCarousel from './BookCarousel'
import PageHeader from './PageHeader'
import Icon from './Icon'
interface Props {
  books: Book[]
  selectedId: string
  onSelect: (id: string) => void
  onOpen: (book: Book) => void
  onBack: () => void
  onSettings: () => void
  motion: boolean
  query: string
  category: string
  onQuery: (q: string) => void
  onCategory: (c: string) => void
}
export default function Library({
  books,
  selectedId,
  onSelect,
  onOpen,
  onBack,
  onSettings,
  motion,
  query,
  category,
  onQuery,
  onCategory,
}: Props) {
  const categories = ['全部', ...new Set(books.map((b) => b.category))]
  const filtered = books.filter(
    (b) =>
      (category === '全部' || b.category === category) &&
      `${b.title}${b.edition || ''}${b.author}${b.tags?.join('') || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  return (
    <main className="library page">
      <PageHeader
        title="我的书库"
        onBack={onBack}
        onSettings={onSettings}
      />
      <section className="page-intro">
        <div className="eyebrow">THE PRIVATE COLLECTION</div>
        <h1 tabIndex={-1}>把世界，收在这里。</h1>
        <p>{books.length} 本私藏 · 总有一本，适合此刻</p>
      </section>
      <label className="search-field">
        <Icon name="search" />
        <input
          type="search"
          aria-label="搜索书名或作者"
          placeholder="找一本书，或一位作者"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </label>
      <nav className="category-tabs" aria-label="书籍分类">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => onCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>
      <BookCarousel
        books={filtered}
        selectedId={selectedId}
        onSelect={onSelect}
        onOpen={onOpen}
        motion={motion}
      />
      <div className="collection-note">
        <Icon name="leaf" />
        <p>书页有尽头，想象没有。</p>
        <span>{filtered.length} 本书 · 私人书籍、公版全文与演示藏书</span>
      </div>
    </main>
  )
}
