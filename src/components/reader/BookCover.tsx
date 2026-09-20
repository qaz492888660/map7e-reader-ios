import type { CSSProperties } from 'react'
import type { Book } from '../../types/book'
export default function BookCover({ book }: { book: Book }) {
  return (
    <div
      className={`book-cover motif-${book.cover.motif}`}
      style={
        {
          '--cover-color': book.cover.color,
          '--cover-dark': book.cover.dark,
        } as CSSProperties
      }
    >
      {book.cover.imageUrl ? (
        <img src={book.cover.imageUrl} alt="" draggable={false} />
      ) : (
        <>
          <span className="cover-edition">
            {book.edition || 'MAP7E · 私藏'}
          </span>
          <span className="cover-title">{book.title}</span>
          <span className="cover-author">
            {book.author.replace('、', ' / ')}
          </span>
          <svg
            className="cover-landscape"
            viewBox="0 0 200 180"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="140" cy="48" r="27" fill="currentColor" opacity=".45" />
            <path
              d="M-20 145 65 48 158 167M37 180 148 83 230 166"
              stroke="currentColor"
              opacity=".7"
            />
            <path
              d="M-20 158 65 75 158 180M0 175 65 100 126 180M89 180 148 110 220 177"
              stroke="currentColor"
              opacity=".3"
            />
            <path
              d="M-10 130Q60 100 116 126T220 118M-10 140Q60 110 116 136T220 128M-10 150Q60 120 116 146T220 138"
              stroke="currentColor"
              opacity=".45"
            />
          </svg>
          <span className="cover-imprint">
            {book.sourceType === 'bundled'
              ? 'MAP7E · 公版藏书'
              : book.learningStage
                ? 'MAP7E · 第一册'
                : '藏 一 个 世 界'}
          </span>
        </>
      )}
    </div>
  )
}
