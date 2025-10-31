import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.ts';
import type { Lending } from '../types.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AdminLayout } from '../components/AdminLayout.tsx';

export const AdminLendingPage = () => {
  const { token } = useAuth();
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLendings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiRequest<{ lendings: Lending[] }>('/lendings/admin/all', { token });
      setLendings(response.lendings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLendings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/lendings/${id}/approve`, { method: 'PATCH', token });
      loadLendings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve lending');
    }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/lendings/${id}/cancel`, { method: 'PATCH', token });
      loadLendings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel lending');
    }
  };

  const handleReturn = async (id: string) => {
    if (!token) return;
    try {
      await apiRequest(`/lendings/${id}/return`, { method: 'PATCH', token });
      loadLendings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lending');
    }
  };

  if (!token) {
    return <p className="text-center text-slate-500">Admin access required.</p>;
  }

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout title="Lending approvals" description="Approve, monitor, and close lending requests.">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {lendings.length === 0 ? (
        <p className="text-sm text-slate-500">No lending requests at the moment.</p>
      ) : (
        <div className="space-y-3">
          {lendings.map((lending) => (
            <div
              key={lending._id}
              className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{lending.book.title}</p>
                <p className="text-sm text-slate-500">
                  Due {new Date(lending.dueDate).toLocaleDateString()} · Status {lending.status}
                </p>
              </div>
              <div className="flex gap-3">
                {lending.status === 'requested' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApprove(lending._id)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(lending._id)}
                      className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {['borrowed', 'approved'].includes(lending.status) && (
                  <button
                    type="button"
                    onClick={() => handleReturn(lending._id)}
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Mark returned
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
