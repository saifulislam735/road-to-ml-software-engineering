import { Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useAdmin';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { data: stats } = useAdminStats();
  const links = [
    ['Dashboard', '/admin'],
    ['Users', '/admin/users'],
    ['Duas', '/admin/duas'],
    ['Reports', '/admin/reports']
  ];
  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <aside className={`${open ? 'block' : 'hidden'} w-full bg-slate-900 p-4 text-slate-100 md:block md:min-h-screen md:w-56`}>
        <nav className="flex h-full flex-col gap-1">
          {links.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-800 border-l-4 border-brand-500' : 'hover:bg-slate-800'}`}
            >
              {label}
              {label === 'Reports' && stats?.reports?.pending > 0 && (
                <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs">{stats.reports.pending}</span>
              )}
            </NavLink>
          ))}
          <NavLink to="/inbox" className="mt-auto rounded-lg px-3 py-2 text-sm hover:bg-slate-800">Back to app</NavLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <button className="md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
            <Menu />
          </button>
          <h1 className="font-semibold">Admin Panel</h1>
          <p className="text-sm text-gray-500">{user?.name || user?.username}</p>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
