import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flag, Mail, ShieldAlert, Users } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { useAdminReports, useAdminStats, useAdminUsers } from '../../hooks/useAdmin';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: duasDaily } = useAdminStats({ chart: 'duas_daily' });
  const { data: usersDaily } = useAdminStats({ chart: 'users_daily' });
  const { data: reports } = useAdminReports({ status: 'pending', limit: 5 });
  const { data: users } = useAdminUsers({ limit: 5 });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Users" value={stats?.users?.total} color="blue" icon={Users} />
        <StatCard title="Duas Today" value={stats?.duas?.today} color="green" icon={Mail} />
        <StatCard title="Pending Reports" value={stats?.reports?.pending} color="orange" icon={Flag} />
        <StatCard title="Banned Users" value={stats?.users?.banned} color="red" icon={ShieldAlert} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold">Duas per day</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={duasDaily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#16a34a" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold">New users per day</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersDaily || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Recent pending reports</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {reports?.reports?.map((report) => <p key={report.id}>{report.reason}</p>) || <p>No pending reports.</p>}
          </div>
        </section>
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="font-semibold">New users</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {users?.users?.map((user) => <p key={user.id}>@{user.username}</p>) || <p>No users yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
