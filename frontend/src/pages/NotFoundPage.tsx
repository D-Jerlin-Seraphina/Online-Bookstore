import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
    <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
    <p className="mt-2 text-sm text-slate-500">We could not find what you were looking for.</p>
    <Link
      to="/"
      className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Return home
    </Link>
  </div>
);
