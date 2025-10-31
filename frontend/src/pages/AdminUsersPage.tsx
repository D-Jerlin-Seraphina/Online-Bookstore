import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { apiRequest } from '../lib/api.ts';
import { useAuth } from '../hooks/useAuth.ts';
import type { AdminUser, UserPreferences } from '../types.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { AdminLayout } from '../components/AdminLayout.tsx';

const roleOptions = [
	{ value: 'user', label: 'Customer' },
	{ value: 'admin', label: 'Admin' },
];

export const AdminUsersPage = () => {
	const { token, user: currentUser } = useAuth();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const loadUsers = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const response = await apiRequest<{ users: AdminUser[] }>('/admin/users', { token });
			setUsers(response.users);
			setError(null);
			setMessage(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load users');
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	const updateUserInState = (updated: AdminUser) => {
		setUsers((prev) => prev.map((user) => (user._id === updated._id ? updated : user)));
	};

	const removeUserFromState = (userId: string) => {
		setUsers((prev) => prev.filter((user) => user._id !== userId));
	};

	const handleRoleChange = async (userId: string, event: ChangeEvent<HTMLSelectElement>) => {
		if (!token) return;
		const role = event.target.value;
		try {
			const response = await apiRequest<{ user: AdminUser }>(`/admin/users/${userId}`, {
				method: 'PATCH',
				token,
				body: { role },
			});
			updateUserInState(response.user);
			setError(null);
			setMessage(`Updated role for ${response.user.name}.`);
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to update role');
		}
	};

	const handleNewsletterToggle = async (userId: string, wantsNewsletter: boolean, preferences: UserPreferences) => {
		if (!token) return;
		try {
			const response = await apiRequest<{ user: AdminUser }>(`/admin/users/${userId}`, {
				method: 'PATCH',
				token,
				body: {
					preferences: { ...preferences, wantsNewsletter },
				},
			});
			updateUserInState(response.user);
			setError(null);
			setMessage(`${response.user.name} ${wantsNewsletter ? 'subscribed to' : 'left'} the newsletter.`);
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to update newsletter preference');
		}
	};

	const handleDelete = async (userId: string) => {
		if (!token) return;
		try {
			await apiRequest(`/admin/users/${userId}`, {
				method: 'DELETE',
				token,
			});
			removeUserFromState(userId);
			setError(null);
			setMessage('User deleted.');
		} catch (err) {
			setMessage(null);
			setError(err instanceof Error ? err.message : 'Failed to delete user');
		}
	};

		if (!token) {
			return <p className="text-center text-slate-500">Admin access required.</p>;
		}

		if (loading) return <LoadingSpinner />;

		return (
			<AdminLayout title="Manage users" description="Control roles, newsletter preferences, and remove inactive accounts.">
				{message && <p className="text-sm text-blue-600">{message}</p>}
				{error && <p className="text-sm text-red-500">{error}</p>}
				{users.length === 0 ? (
					<p className="text-sm text-slate-500">No users found.</p>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{users.map((adminUser) => {
							const canDelete = !currentUser || currentUser.id !== adminUser._id;
							const newsletter = adminUser.preferences?.wantsNewsletter ?? false;
							return (
								<div key={adminUser._id} className="rounded-2xl bg-white p-5 shadow-sm">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-slate-900">{adminUser.name}</p>
											<p className="text-xs text-slate-500">{adminUser.email}</p>
											<p className="text-xs text-slate-400">
												Joined {new Date(adminUser.createdAt).toLocaleDateString()}
											</p>
										</div>
										<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">
											{adminUser.role}
										</span>
									</div>
									<div className="mt-3 space-y-3 text-sm text-slate-600">
										<label className="flex items-center justify-between">
											Role
											<select
												value={adminUser.role}
												onChange={(event) => handleRoleChange(adminUser._id, event)}
												className="rounded-md border border-slate-200 px-2 py-1"
												disabled={!canDelete}
											>
												{roleOptions.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</select>
										</label>
										<label className="flex items-center justify-between gap-2">
											<span>Newsletter opt-in</span>
											<input
												type="checkbox"
												checked={newsletter}
												onChange={(event) =>
													handleNewsletterToggle(
														adminUser._id,
														event.target.checked,
														adminUser.preferences ?? { favoriteGenres: [], wantsNewsletter: false }
													)
												}
												className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
											/>
										</label>
										{adminUser.preferences?.favoriteGenres && adminUser.preferences.favoriteGenres.length > 0 && (
											<div>
												<p className="text-xs uppercase tracking-wide text-slate-400">Favorite genres</p>
												<p className="text-sm text-slate-600">{adminUser.preferences.favoriteGenres.join(', ')}</p>
											</div>
										)}
									</div>
									<div className="mt-4 flex justify-between text-sm">
										<button
											type="button"
											onClick={() => loadUsers()}
											className="rounded-md border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100"
										>
											Refresh
										</button>
										<button
											type="button"
											onClick={() => handleDelete(adminUser._id)}
											className="rounded-md border border-red-200 px-3 py-2 font-semibold text-red-600 hover:bg-red-50"
											disabled={!canDelete}
										>
											Delete
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</AdminLayout>
		);
};
