import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api.ts';
import type { Book } from '../types.ts';
import { RecommendationCarousel } from '../components/RecommendationCarousel.tsx';

export const HomePage = () => {
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const popular = await apiRequest<{ books: Book[] }>('/books?sort=popularity');
        setPopularBooks(popular.books.slice(0, 6));
        const fresh = await apiRequest<{ books: Book[] }>('/books');
        setNewArrivals(fresh.books.slice(0, 6));
      } catch (error) {
        console.error('Failed to load home data', error);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-10">
  <section className="rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 p-10 text-white shadow-lg">
        <div className="max-w-xl space-y-4">
          <p className="rounded-full bg-white/10 px-3 py-1 text-sm uppercase tracking-wide text-white/90">
            Your digital library
          </p>
          <h1 className="text-4xl font-semibold">
            Discover, buy, and borrow the stories that move you.
          </h1>
          <p className="text-lg text-white/80">
            Browse thousands of titles across every genre. Build your personal bookshelf, borrow from friends,
            and keep tabs on your next great read.
          </p>
          <div className="flex gap-3">
            <Link
              to="/catalog"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow hover:bg-blue-50"
            >
              Browse catalog
            </Link>
            <Link
              to="/register"
              className="rounded-md border border-white/60 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-800">Buy or borrow</h3>
          <p className="mt-2 text-sm text-slate-600">Flexible access for every reader. Purchase to own or borrow for a quick weekend binge.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-800">Personalized shelves</h3>
          <p className="mt-2 text-sm text-slate-600">Wishlist, recommendations, and reading reminders tailored to your preferences.</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-800">Admin ready</h3>
          <p className="mt-2 text-sm text-slate-600">Manage inventory, lending approvals, and analytics from a dedicated control center.</p>
        </div>
      </section>

      <RecommendationCarousel books={popularBooks} title="Popular picks" />
      <RecommendationCarousel books={newArrivals} title="New arrivals" />
    </div>
  );
};
