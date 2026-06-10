import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import Inbox from './pages/Inbox';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PublicProfile from './pages/PublicProfile';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Share from './pages/Share';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDuas from './pages/admin/AdminDuas';
import AdminLayout from './pages/admin/AdminLayout';
import AdminReports from './pages/admin/AdminReports';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/share" element={<Share />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="duas" element={<AdminDuas />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
