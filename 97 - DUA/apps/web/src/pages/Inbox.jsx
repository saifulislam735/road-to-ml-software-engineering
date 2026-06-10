import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import DuaCard from '../components/DuaCard';
import Button from '../components/ui/Button';
import { useDeleteDua, useInbox, useMarkRead } from '../hooks/useDuas';

export default function Inbox() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInbox(page);
  const markRead = useMarkRead();
  const deleteDua = useDeleteDua();

  useEffect(() => {
    data?.duas?.filter((dua) => !dua.isRead).forEach((dua) => markRead.mutate(dua.id));
  }, [data]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        {isLoading && <p>Loading...</p>}
        {!isLoading && data?.duas?.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-gray-500">No duas yet.</p>}
        <div className="space-y-3">
          {data?.duas?.map((dua) => (
            <DuaCard key={dua.id} dua={dua} onDelete={(id) => deleteDua.mutate(id)} />
          ))}
        </div>
        {data?.pagination && (
          <div className="flex items-center justify-between">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <span className="text-sm text-gray-500">Page {page} of {data.pagination.totalPages || 1}</span>
            <Button variant="secondary" disabled={page >= data.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        )}
      </main>
    </>
  );
}
