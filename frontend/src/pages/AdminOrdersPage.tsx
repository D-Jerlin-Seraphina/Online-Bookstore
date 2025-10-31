import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { apiRequest } from '../lib/api.ts';
import { useAuth } from '../hooks/useAuth.ts';
import type { Order } from '../types.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AdminLayout } from '../components/AdminLayout.tsx';

const statusOptions: Array<{ value: Order['status']; label: string }> = [
	{ value: 'processing', label: 'Processing' },
	{ value: 'shipped', label: 'Shipped' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

const paymentOptions: Array<{ value: Order['paymentStatus']; label: string }> = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'paid', label: 'Paid' },
	{ value: 'failed', label: 'Failed' },
	{ value: 'refunded', label: 'Refunded' },
];

type OrderWithUser = Order;

export const AdminOrdersPage = () => {
	const { token } = useAuth();
	const [orders, setOrders] = useState<OrderWithUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	const loadOrders = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const response = await apiRequest<{ orders: OrderWithUser[] }>('/orders/admin/all', { token });
			setOrders(response.orders);
			setError(null);
			setMessage(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load orders');
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		loadOrders();
	}, [loadOrders]);

	const updateOrderInState = (updated: OrderWithUser) => {
		setOrders((prev) => prev.map((order) => (order._id === updated._id ? updated : order)));
	};

	const removeOrderFromState = (orderId: string) => {
		setOrders((prev) => prev.filter((order) => order._id !== orderId));
	};

	const handleStatusChange = async (orderId: string, event: ChangeEvent<HTMLSelectElement>) => {
		if (!token) return;
		const nextStatus = event.target.value as Order['status'];
		try {
			const response = await apiRequest<{ order: OrderWithUser }>(`/orders/${orderId}/status`, {
				method: 'PATCH',
				token,
				body: { status: nextStatus },
			});
			updateOrderInState(response.order);
			setError(null);
			setMessage(`Order ${response.order.confirmationCode} status updated.`);
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to update order status');
		}
	};

	const handlePaymentChange = async (orderId: string, event: ChangeEvent<HTMLSelectElement>) => {
		if (!token) return;
		const nextStatus = event.target.value as Order['paymentStatus'];
		try {
			const response = await apiRequest<{ order: OrderWithUser }>(`/orders/${orderId}/status`, {
				method: 'PATCH',
				token,
				body: { paymentStatus: nextStatus },
			});
			updateOrderInState(response.order);
			setError(null);
			setMessage(`Order ${response.order.confirmationCode} payment updated.`);
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to update payment status');
		}
	};

	const handleCancel = async (orderId: string) => {
		if (!token) return;
		try {
			const response = await apiRequest<{ order: OrderWithUser }>(`/orders/${orderId}/cancel`, {
				method: 'PATCH',
				token,
			});
			updateOrderInState(response.order);
			setError(null);
			setMessage(`Order ${response.order.confirmationCode} cancelled.`);
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to cancel order');
		}
	};

	const handleDelete = async (orderId: string) => {
		if (!token) return;
		try {
			await apiRequest(`/orders/${orderId}`, {
				method: 'DELETE',
				token,
			});
			removeOrderFromState(orderId);
			setError(null);
			setMessage('Order removed.');
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to delete order');
		}
	};

	const toggleExpanded = (orderId: string) => {
		setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
	};

		if (!token) {
			return <p className="text-center text-slate-500">Admin access required.</p>;
		}

		if (loading) return <LoadingSpinner />;

		return (
			<AdminLayout title="Manage orders" description="Track, update, refund, or remove customer orders.">
				{message && <p className="text-sm text-blue-600">{message}</p>}
				{error && <p className="text-sm text-red-500">{error}</p>}
				{orders.length === 0 ? (
					<p className="text-sm text-slate-500">No orders found.</p>
				) : (
					<div className="space-y-4">
						{orders.map((order) => {
							const disableStatusSelect = order.status === 'cancelled';
							const disablePaymentSelect = order.paymentStatus === 'refunded';
							const isExpanded = expanded[order._id] ?? false;
							return (
								<div key={order._id} className="rounded-2xl bg-white p-5 shadow-sm">
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<div>
											<p className="text-sm font-semibold text-slate-900">{order.confirmationCode}</p>
											<p className="text-xs text-slate-500">
												{new Date(order.createdAt).toLocaleString()} · Updated {new Date(order.updatedAt).toLocaleString()}
											</p>
											{order.user && (
												<p className="text-xs text-slate-500">
													{order.user.name} · {order.user.email}
												</p>
											)}
										</div>
										<div className="flex flex-wrap gap-3 text-sm">
											<label className="flex items-center gap-2 text-slate-600">
												Status
												<select
													value={order.status}
													disabled={disableStatusSelect}
													onChange={(event) => handleStatusChange(order._id, event)}
													className="rounded-md border border-slate-200 px-2 py-1"
												>
													{statusOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
											</label>
											<label className="flex items-center gap-2 text-slate-600">
												Payment
												<select
													value={order.paymentStatus}
													disabled={disablePaymentSelect}
													onChange={(event) => handlePaymentChange(order._id, event)}
													className="rounded-md border border-slate-200 px-2 py-1"
												>
													{paymentOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
											</label>
										</div>
									</div>
									<div className="mt-3 flex flex-wrap gap-2 text-sm">
										{order.status !== 'cancelled' && order.status !== 'completed' && (
											<button
												type="button"
												onClick={() => handleCancel(order._id)}
												className="rounded-md border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100"
											>
												Cancel order
											</button>
										)}
										<button
											type="button"
											onClick={() => handleDelete(order._id)}
											className="rounded-md border border-red-200 px-3 py-2 font-semibold text-red-600 hover:bg-red-50"
										>
											Delete
										</button>
										<button
											type="button"
											onClick={() => toggleExpanded(order._id)}
											className="rounded-md bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700"
										>
											{isExpanded ? 'Hide items' : 'View items'}
										</button>
										<div className="ml-auto text-right text-base font-semibold text-slate-900">
											${order.subtotal.toFixed(2)}
										</div>
									</div>
									{isExpanded && (
										<div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
											{order.items.map((item) => (
												<div key={`${order._id}-${item.title}`} className="flex items-center justify-between">
													<span>
														{item.title} · {item.quantity} × ${item.price.toFixed(2)}
													</span>
													<span className="font-medium text-slate-700">${(item.price * item.quantity).toFixed(2)}</span>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</AdminLayout>
		);
};
