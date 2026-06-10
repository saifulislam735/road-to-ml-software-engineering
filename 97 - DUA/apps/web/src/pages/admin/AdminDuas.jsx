import { useState } from 'react';
import AdminTable from '../../components/admin/AdminTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAdminDeleteDua, useAdminDuas, useHideDua } from '../../hooks/useAdmin';
import { relativeDate, truncate } from '../../utils/helpers';

export default function AdminDuas() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const params = {
    page,
    hidden: tab === 'hidden' ? 'true' : undefined,
    reported: tab === 'reported' ? 'true' : undefined
  };
  const { data, isLoading, error } = useAdminDuas(params);
  const hideDua = useHideDua();
  const deleteDua = useAdminDeleteDua();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'reported', 'hidden'].map((item) => (
          <Button key={item} variant={tab === item ? 'primary' : 'secondary'} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>
      <AdminTable isLoading={isLoading} error={error} isEmpty={data?.duas?.length === 0} emptyMessage="No duas found." pagination={data?.pagination} onPageChange={setPage}>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr><th className="px-4 py-2">Message</th><th>Sent to</th><th>Date</th><th>Reports</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data?.duas?.map((dua) => (
              <tr key={dua.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{truncate(dua.message, 60)}</td>
                <td>@{dua.owner?.username}</td>
                <td>{relativeDate(dua.createdAt)}</td>
                <td><Badge tone={dua._count?.reports > 0 ? 'red' : 'gray'}>{dua._count?.reports || 0}</Badge></td>
                <td><Badge tone={dua.isHidden ? 'orange' : 'green'}>{dua.isHidden ? 'Hidden' : 'Visible'}</Badge></td>
                <td className="space-x-2">
                  <Button variant="secondary" className="h-8" onClick={() => hideDua.mutate({ id: dua.id, hidden: !dua.isHidden })}>{dua.isHidden ? 'Show' : 'Hide'}</Button>
                  <Button variant="danger" className="h-8" onClick={() => deleteDua.mutate(dua.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
    </div>
  );
}
