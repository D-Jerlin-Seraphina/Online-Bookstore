import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.ts';
import type { Lending } from '../types.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';

export const LendingPage = () => {
  const { token } = useAuth();
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLendings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ lendings: Lending[] }>('/lendings', { token });
      setLendings(response.lendings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lending activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLendings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      const response = await apiRequest<{ lending: Lending }>(`/lendings/${id}/cancel`, {
        method: 'PATCH',
        token,
      });
      setLendings((prev) => prev.map((lending) => (lending._id === id ? response.lending : lending)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    }
  };

  const handleReturn = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/lendings/${id}/return`, { method: 'PATCH', token });
      loadLendings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return book');
    }
  };

  if (!token) {
    return <p className="text-center text-slate-500">Login to track your borrow history.</p>;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  if (lendings.length === 0) {
    return <p className="text-center text-slate-500">No lending activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Lending tracker</h1>
      <div className="space-y-4">
        {lendings.map((lending) => (
          <div key={lending._id} className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{lending.book.title}</h2>
              <p className="text-sm text-slate-500">Due {new Date(lending.dueDate).toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">Status: {lending.status}</p>
            </div>
            {lending.status === 'requested' && (
              <button
                type="button"
                onClick={() => handleCancel(lending._id)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel request
              </button>
            )}
            {['borrowed', 'approved'].includes(lending.status) && (
              <button
                type="button"
                onClick={() => handleReturn(lending._id)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mark as returned
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
