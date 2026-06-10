import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import { useAdminDeleteDua, useAdminUser, useBanUser, useDeleteUser, useHideDua, useUnbanUser } from '../../hooks/useAdmin';
import { relativeDate } from '../../utils/helpers';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminUser(id);
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const deleteUser = useDeleteUser();
  const hideDua = useHideDua();
  const deleteDua = useAdminDeleteDua();

  if (isLoading) return <p>Loading...</p>;
  const user = data?.user;

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar user={user} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold">{user?.name || user?.username}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-2 flex gap-2">
              <Badge tone="blue">{user?.role}</Badge>
              <Badge tone={user?.isBanned ? 'red' : 'green'}>{user?.isBanned ? 'Banned' : 'Active'}</Badge>
            </div>
          </div>
        </div>
        {user?.banReason && <p className="mt-3 text-sm text-red-700">Ban reason: {user.banReason}</p>}
      </section>
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Duas received</h2>
        <div className="mt-3 space-y-2">
          {data?.duas?.map((dua) => (
            <div key={dua.id} className="rounded-lg border border-gray-100 p-3 text-sm">
              <p>{dua.message}</p>
              <p className="mt-1 text-xs text-gray-400">{relativeDate(dua.createdAt)}</p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" className="h-8" onClick={() => hideDua.mutate({ id: dua.id, hidden: !dua.isHidden })}>{dua.isHidden ? 'Show' : 'Hide'}</Button>
                <Button variant="danger" className="h-8" onClick={() => deleteDua.mutate(dua.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-red-700">Danger zone</h2>
        {user?.isBanned ? (
          <Button className="mt-3" variant="secondary" onClick={() => unbanUser.mutate(user.id)}>Unban user</Button>
        ) : (
          <div className="mt-3 space-y-2">
            <Textarea placeholder="Ban reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button variant="danger" disabled={reason.length < 10} onClick={() => banUser.mutate({ id: user.id, reason })}>Ban user</Button>
          </div>
        )}
        <Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}>Delete permanently</Button>
      </section>
      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete account"
        message="This will delete the user and all their duas. This cannot be undone."
        confirmLabel="Delete permanently"
        isDanger
        isLoading={deleteUser.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteUser.mutateAsync(user.id);
          toast.success('User deleted.');
          navigate('/admin/users');
        }}
      />
    </div>
  );
}
