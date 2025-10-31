import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiRequest } from '../lib/api.ts';
import type { Book } from '../types.ts';
import { BookCard } from '../components/BookCard.tsx';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';

interface BookResponse {
  books: Book[];
  genres: string[];
}

export const CatalogPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sort, setSort] = useState('');

  const loadBooks = async (params?: { search?: string; genre?: string; sort?: string }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.genre) query.set('genre', params.genre);
      if (params?.sort) query.set('sort', params.sort);
      const response = await apiRequest<BookResponse>(`/books${query.toString() ? `?${query}` : ''}`);
      setBooks(response.books);
      setGenres(response.genres);
    } catch (error) {
      console.error('Failed to load catalog', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks({ search, genre: selectedGenre, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre, sort]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadBooks({ search, genre: selectedGenre, sort });
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <form className="flex flex-1 flex-wrap gap-3" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search by title or author"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-64 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={selectedGenre}
            onChange={(event) => setSelectedGenre(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Sort by</option>
            <option value="price">Price</option>
            <option value="popularity">Popularity</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>
        <p className="text-sm text-slate-500">{books.length} books available</p>
      </section>

      {loading ? (
        <LoadingSpinner />
      ) : books.length === 0 ? (
        <p className="text-center text-slate-500">No books found. Try adjusting your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};
