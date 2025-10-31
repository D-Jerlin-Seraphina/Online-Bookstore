import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.ts';
import type { Book } from '../types.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useCart } from '../hooks/useCart.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';

export const WishlistPage = () => {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ wishlist: Book[] }>('/wishlist', { token });
      setWishlist(response.wishlist);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRemove = async (bookId: string) => {
    if (!token) return;
    try {
      const response = await apiRequest<{ wishlist: Book[] }>(`/wishlist/${bookId}`, {
        method: 'DELETE',
        token,
      });
      setWishlist(response.wishlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wishlist');
    }
  };

  if (!token) {
    return <p className="text-center text-slate-500">Login to manage your wishlist.</p>;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  if (wishlist.length === 0) {
    return <p className="text-center text-slate-500">Your wishlist is empty.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Wishlist</h1>
      <div className="space-y-4">
        {wishlist.map((book) => (
          <div key={book._id} className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{book.title}</h2>
              <p className="text-sm text-slate-500">{book.author}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => addToCart(book)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => handleRemove(book._id)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
