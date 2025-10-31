import { Link } from 'react-router-dom';
import type { Book } from '../types.ts';
import { normalizeImageSrc } from '../utils/image.ts';

interface RecommendationCarouselProps {
  books: Book[];
  title?: string;
}

export const RecommendationCarousel = ({ books, title = 'Recommended for you' }: RecommendationCarouselProps) => {
  if (books.length === 0) return null;

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {books.map((book) => {
          const coverSrc = normalizeImageSrc(book.coverImage);
          return (
            <Link
              key={book._id}
              to={`/books/${book._id}`}
              className="min-w-48 rounded-lg border border-slate-200 bg-white px-4 py-5 shadow-sm transition hover:-translate-y-1"
            >
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={`${book.title} cover`}
                  className="mb-3 h-40 w-full rounded-md object-cover"
                />
              ) : (
                <div className="mb-3 h-40 rounded-md bg-slate-100" aria-hidden />
              )}
              <h4 className="font-semibold text-slate-800">{book.title}</h4>
              <p className="text-sm text-slate-500">{book.author}</p>
              <p className="mt-2 text-sm text-slate-600">${book.price.toFixed(2)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
