import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/books', label: 'Books' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/lending', label: 'Lending' },
  { to: '/admin/users', label: 'Users' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
  }`;

export const AdminSidebar = () => (
  <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:w-64">
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Admin</p>
      <nav className="mt-4 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </aside>
);
