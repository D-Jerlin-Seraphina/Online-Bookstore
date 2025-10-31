import { Link } from 'react-router-dom';
import type { Book } from '../types.ts';
import { useCart } from '../hooks/useCart.ts';

interface BookCardProps {
  book: Book;
}

export const BookCard = ({ book }: BookCardProps) => {
  const { addToCart } = useCart();

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <div className="h-48 rounded-md bg-slate-100" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{book.title}</h3>
        <p className="text-sm text-slate-500">{book.author}</p>
        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{book.summary}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span className="font-semibold text-blue-600">${book.price.toFixed(2)}</span>
        <span>⭐ {book.averageRating.toFixed(1)}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => addToCart(book, 1)}
          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add to Cart
        </button>
        <Link
          to={`/books/${book._id}`}
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Details
        </Link>
      </div>
    </div>
  );
};
