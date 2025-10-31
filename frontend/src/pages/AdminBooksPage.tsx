import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { apiRequest } from '../lib/api.ts';
import { fileToDataUrl } from '../utils/image.ts';
import type { Book } from '../types.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AdminLayout } from '../components/AdminLayout.tsx';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const initialForm = {
  title: '',
  author: '',
  genre: '',
  summary: '',
  price: 0,
  stock: 0,
  coverImage: '',
};

export const AdminBooksPage = () => {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  const loadBooks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ books: Book[] }>('/books', { token });
      setBooks(response.books);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async () => {
    if (!token) return;
    try {
      if (isEditing && editingBookId) {
        await apiRequest<{ book: Book }>(`/books/${editingBookId}`, {
          method: 'PUT',
          token,
          body: form,
        });
        setMessage('Book updated');
      } else {
        await apiRequest<{ book: Book }>('/books', {
          method: 'POST',
          token,
          body: form,
        });
        setMessage('Book added');
      }
      setForm(initialForm);
      setIsEditing(false);
      setEditingBookId(null);
      setError(null);
      loadBooks();
    } catch (error) {
      setMessage(null);
      setError(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'add'} book`);
    }
  };

  const handleEdit = (book: Book) => {
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      summary: book.summary,
      price: book.price,
      stock: book.stock,
      coverImage: book.coverImage ?? '',
    });
    setIsEditing(true);
    setEditingBookId(book._id);
    setMessage(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setForm(initialForm);
    setIsEditing(false);
    setEditingBookId(null);
    setMessage(null);
    setError(null);
  };

  const handleCoverImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image must be smaller than ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB.`);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, coverImage: dataUrl }));
      setError(null);
    } catch {
      setError('Failed to read image, please choose a different file.');
    }
  };

  const handleRemoveCoverImage = () => {
    setForm((prev) => ({ ...prev, coverImage: '' }));
  };

  const handleUpdateStock = async (bookId: string, stock: number) => {
    if (!token) return;
    try {
      await apiRequest<{ book: Book }>(`/books/${bookId}`, {
        method: 'PUT',
        token,
        body: { stock },
      });
      setMessage('Inventory updated');
      setError(null);
      loadBooks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update inventory');
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!token) return;
    try {
      await apiRequest(`/books/${bookId}`, {
        method: 'DELETE',
        token,
      });
      setMessage('Book removed');
      setError(null);
      loadBooks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete book');
    }
  };

  if (!token) {
    return <p className="text-center text-slate-500">Admin access required.</p>;
  }

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout
      title="Manage books"
      description="Add new titles and keep inventory accurate."
    >
      {message && <p className="text-sm text-blue-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEditing ? 'Edit book' : 'Add new book'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Author"
            value={form.author}
            onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Genre"
            value={form.genre}
            onChange={(event) => setForm((prev) => ({ ...prev, genre: event.target.value }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Summary"
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            className="md:col-span-2 min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="md:col-span-2 space-y-2">
            <label className="flex flex-col text-sm text-slate-600">
              Cover image (max {Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB)
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            {form.coverImage && (
              <div className="flex items-center gap-3">
                <img
                  src={form.coverImage}
                  alt={`${form.title || 'Book'} cover preview`}
                  className="h-20 w-16 rounded-md border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveCoverImage}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {isEditing ? 'Update book' : 'Add book'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Inventory</h2>
        {books.length === 0 ? (
          <p className="text-sm text-slate-500">No books available.</p>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <div key={book._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{book.title}</p>
                  <p className="text-sm text-slate-500">{book.author}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-500">
                    Stock
                    <input
                      type="number"
                      defaultValue={book.stock}
                      onBlur={(event) =>
                        handleUpdateStock(book._id, Number(event.target.value))
                      }
                      className="ml-2 w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleEdit(book)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(book._id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
