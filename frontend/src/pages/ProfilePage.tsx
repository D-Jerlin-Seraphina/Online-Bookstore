import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.ts';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState('');
  const [wantsNewsletter, setWantsNewsletter] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setFavoriteGenres(user.preferences.favoriteGenres.join(', '));
    setWantsNewsletter(user.preferences.wantsNewsletter);
  }, [user]);

  if (!user) {
    return <p className="text-center text-slate-500">Please login to view your profile.</p>;
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        name,
        preferences: {
          favoriteGenres: favoriteGenres
            .split(',')
            .map((genre) => genre.trim())
            .filter(Boolean),
          wantsNewsletter,
        },
      });
      setMessage('Profile updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-2">
          <label className="text-sm text-slate-500">Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-slate-500">Email</label>
          <input value={user.email} disabled className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm text-slate-500">Favorite genres</label>
          <input
            value={favoriteGenres}
            onChange={(event) => setFavoriteGenres(event.target.value)}
            placeholder="Fantasy, Mystery, Sci-Fi"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="checkbox"
            checked={wantsNewsletter}
            onChange={(event) => setWantsNewsletter(event.target.checked)}
          />
          Receive release reminders
        </label>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Save changes
        </button>
        {message && <p className="text-sm text-blue-600">{message}</p>}
      </div>
    </div>
  );
};
