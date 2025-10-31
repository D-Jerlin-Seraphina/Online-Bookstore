import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api.ts';
import type { Book } from '../types.ts';
import { useCart } from '../hooks/useCart.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { RecommendationCarousel } from '../components/RecommendationCarousel.tsx';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { normalizeImageSrc } from '../utils/image.ts';

interface BookResponse {
  book: Book;
}

export const BookDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { token, user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [{ book: detail }, rec] = await Promise.all([
          apiRequest<BookResponse>(`/books/${id}`),
          apiRequest<{ recommendations: Book[] }>(`/books/${id}/recommendations`),
        ]);
        setBook(detail);
        setAiInsight(null);
        setAiError(null);
        setRecommendations(rec.recommendations);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };
    loadBook();
  }, [id]);

  const handleBorrow = async () => {
    if (!token || !id) {
      setMessage('Please login to borrow books.');
      return;
    }
    try {
      await apiRequest('/lendings', {
        method: 'POST',
        body: { bookId: id },
        token,
      });
      setMessage('Borrow request submitted! We will notify you when approved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not borrow book');
    }
  };

  const handleWishlist = async () => {
    if (!token || !id) {
      setMessage('Please login to add items to your wishlist.');
      return;
    }
    try {
      await apiRequest('/wishlist', {
        method: 'POST',
        body: { bookId: id },
        token,
      });
      setMessage('Added to wishlist');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not add to wishlist');
    }
  };

  const handleReview = async () => {
    if (!token || !id) {
      setMessage('Please login to review books.');
      return;
    }
    try {
      const response = await apiRequest<BookResponse>(`/books/${id}/reviews`, {
        method: 'POST',
        body: review,
        token,
      });
      setBook(response.book);
      setMessage('Thanks for sharing your thoughts!');
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not submit review');
    }
  };

  const handleGenerateInsight = async () => {
    if (!book) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await apiRequest<{ insight: string }>('/ai/book-insights', {
        method: 'POST',
        body: {
          title: book.title,
          author: book.author,
          genre: book.genre,
          summary: book.summary,
        },
        token,
      });
      setAiInsight(response.insight);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Could not generate AI insight');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!book) return <p className="text-center text-slate-500">Book not found.</p>;

  const coverSrc = normalizeImageSrc(book.coverImage);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-[1fr_2fr]">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={`${book.title} cover`}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <div className="rounded-lg bg-slate-100" aria-hidden />
        )}
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-blue-600">{book.genre}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{book.title}</h1>
          <p className="text-slate-500">By {book.author}</p>
          <p className="text-sm text-slate-600">{book.summary}</p>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>⭐ {book.averageRating.toFixed(1)} ({book.reviews.length} reviews)</span>
            <span>Stock: {book.stock}</span>
            <span>Borrowed {book.timesBorrowed} times</span>
          </div>
          <p className="text-2xl font-semibold text-blue-600">${book.price.toFixed(2)}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addToCart(book, 1)}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={handleBorrow}
              className="rounded-md border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              Borrow
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              className="rounded-md border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Add to wishlist
            </button>
            <button
              type="button"
              onClick={handleGenerateInsight}
              disabled={aiLoading}
              className="rounded-md border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? 'Fetching insights…' : 'Ask Gemini for insights'}
            </button>
          </div>
          {message && <p className="text-sm text-blue-600">{message}</p>}
          {aiError && <p className="text-sm text-red-500">{aiError}</p>}
          {aiInsight && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-sm text-slate-700">
              <p className="whitespace-pre-wrap font-medium text-blue-900">AI spotlight</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{aiInsight}</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Community reviews</h2>
        {book.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to leave one!</p>
        ) : (
          <div className="mt-4 space-y-4">
            {book.reviews.map((entry) => (
              <div key={entry._id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-800">{entry.user.name}</p>
                <p className="text-xs text-slate-500">Rated {entry.rating}/5</p>
                <p className="mt-2 text-sm text-slate-600">{entry.comment}</p>
              </div>
            ))}
          </div>
        )}
        {user && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Share your thoughts</h3>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Rating
                <select
                  value={review.rating}
                  onChange={(event) => setReview((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                value={review.comment}
                onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder="Write a short review"
                className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleReview}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Submit review
              </button>
            </div>
          </div>
        )}
      </section>

      <RecommendationCarousel books={recommendations} />
    </div>
  );
};
