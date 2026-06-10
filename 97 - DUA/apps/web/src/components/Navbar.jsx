import { Link, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/inbox" className="font-semibold text-brand-700">Dua Platform</Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/share">Share</Link>
          <Link to="/settings">Settings</Link>
          {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </Button>
        </nav>
      </div>
    </header>
  );
}
