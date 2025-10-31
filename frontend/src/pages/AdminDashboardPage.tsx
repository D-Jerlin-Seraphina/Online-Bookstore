import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { apiRequest } from '../lib/api.ts';
import type { AnalyticsSummary } from '../types.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AdminLayout } from '../components/AdminLayout.tsx';

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

export const AdminDashboardPage = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await apiRequest<AnalyticsSummary>('/admin/analytics', { token });
        setAnalytics(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (!token) {
    return <p className="text-center text-slate-500">Admin access only.</p>;
  }

  if (loading) return <LoadingSpinner />;

  if (!analytics) {
    return (
      <AdminLayout title="Admin dashboard" description="Monitor store health and keep operations on track.">
        <p className="text-sm text-red-500">{error ?? 'Analytics data is not available yet.'}</p>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/admin/books"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add or edit books
            </Link>
            <Link
              to="/admin/lending"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Review lending requests
            </Link>
            <Link
              to="/admin/orders"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Manage orders
            </Link>
            <Link
              to="/admin/users"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Manage users
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin dashboard" description="Monitor store health and keep operations on track.">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total sales" value={`$${analytics.totalSales.toFixed(2)}`} />
        <StatCard label="Orders" value={analytics.totalOrders.toString()} />
        <StatCard label="Books borrowed" value={analytics.totalBorrows.toString()} />
        <StatCard label="Active loans" value={analytics.activeBorrows.toString()} />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Top genres</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <BarChart data={analytics.topGenres}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="genre" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="sales" fill="#2563eb" name="Sales" />
              <Bar dataKey="borrows" fill="#22c55e" name="Borrows" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/books"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add or edit books
          </Link>
          <Link
            to="/admin/lending"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Review lending requests
          </Link>
          <Link
            to="/admin/orders"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Manage orders
          </Link>
          <Link
            to="/admin/users"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Manage users
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};
