import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.ts';
import type { Order } from '../types.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';

export const OrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await apiRequest<{ orders: Order[] }>('/orders', { token });
        setOrders(response.orders);
        setError(null);
        setActionMessage(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [token]);

  const handleCancel = async (orderId: string) => {
    if (!token) return;
    try {
      const response = await apiRequest<{ order: Order }>(`/orders/${orderId}/cancel`, {
        method: 'PATCH',
        token,
      });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? response.order : order)));
      setError(null);
      setActionMessage('Order cancelled successfully.');
    } catch (err) {
      setActionMessage(null);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  if (!token) {
    return <p className="text-center text-slate-500">Login to view your orders.</p>;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  if (orders.length === 0) {
    return <p className="text-center text-slate-500">No orders yet. Start building your library!</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Order history</h1>
      {actionMessage && <p className="text-sm text-blue-600">{actionMessage}</p>}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <p>Confirmation: {order.confirmationCode}</p>
              <p>{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                Status: <span className="font-semibold text-slate-700">{order.status}</span>
              </span>
              <span>
                Payment: <span className="font-semibold text-slate-700">{order.paymentStatus}</span>
              </span>
              <span>Updated: {new Date(order.updatedAt).toLocaleString()}</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {order.items.map((item) => (
                <p key={item.title}>
                  {item.quantity} × {item.title} — ${item.price.toFixed(2)}
                </p>
              ))}
            </div>
            <p className="mt-3 text-right text-lg font-semibold text-slate-900">Total ${order.subtotal.toFixed(2)}</p>
            {order.status === 'processing' && (
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={() => handleCancel(order._id)}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
