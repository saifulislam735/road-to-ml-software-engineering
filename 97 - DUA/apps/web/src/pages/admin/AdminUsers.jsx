import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import AdminTable from '../../components/admin/AdminTable';
import BanModal from '../../components/admin/BanModal';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAdminUsers, useBanUser, useUnbanUser } from '../../hooks/useAdmin';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [banned, setBanned] = useState('');
  const [banTarget, setBanTarget] = useState(null);
  const { data, isLoading, error } = useAdminUsers({ page, search, banned });
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  async function confirmBan(reason) {
    await banUser.mutateAsync({ id: banTarget.id, reason });
    setBanTarget(null);
    toast.success('User banned.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm md:flex-row">
        <Input placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select className="h-10 rounded-lg border border-gray-200 px-3 text-sm" value={banned} onChange={(event) => setBanned(event.target.value)}>
          <option value="">All</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>
      </div>
      <AdminTable isLoading={isLoading} error={error} isEmpty={data?.users?.length === 0} emptyMessage="No users found." pagination={data?.pagination} onPageChange={setPage}>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr><th className="px-4 py-2">User</th><th>Email</th><th>Duas</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data?.users?.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="flex items-center gap-2 px-4 py-2"><Avatar user={user} size="sm" /> @{user.username}</td>
                <td>{user.email}</td>
                <td>{user._count?.duas || 0}</td>
                <td><Badge tone={user.isBanned ? 'red' : 'green'}>{user.isBanned ? 'Banned' : 'Active'}</Badge></td>
                <td className="space-x-2">
                  <Link className="text-brand-700" to={`/admin/users/${user.id}`}>View</Link>
                  {user.isBanned ? (
                    <Button variant="secondary" className="h-8" onClick={() => unbanUser.mutate(user.id)}>Unban</Button>
                  ) : (
                    <Button variant="danger" className="h-8" onClick={() => setBanTarget(user)}>Ban</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      <BanModal isOpen={Boolean(banTarget)} username={banTarget?.username} isLoading={banUser.isPending} onClose={() => setBanTarget(null)} onConfirm={confirmBan} />
    </div>
  );
}
