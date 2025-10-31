import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';
import { useCart } from '../hooks/useCart.ts';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-xl font-semibold text-blue-600">
          Chapter & Chill
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/catalog" className={linkClass}>
            Catalog
          </NavLink>
          <NavLink to="/wishlist" className={linkClass}>
            Wishlist
          </NavLink>
          <NavLink to="/lending" className={linkClass}>
            Lending
          </NavLink>
          <NavLink to="/cart" className={linkClass}>
            Cart {cartCount > 0 && <span className="ml-1 rounded-full bg-blue-600 px-2 text-xs text-white">{cartCount}</span>}
          </NavLink>
          {user ? (
            <div className="flex items-center gap-2">
              <NavLink to="/profile" className={linkClass}>
                {user.name.split(' ')[0]}
              </NavLink>
              <NavLink to="/orders" className={linkClass}>
                Orders
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin/dashboard" className={linkClass}>
                  Admin
                </NavLink>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Sign Up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
