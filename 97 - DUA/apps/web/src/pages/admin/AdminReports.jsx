import { useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAdminReports, useDismissReport, useResolveReport } from '../../hooks/useAdmin';
import { relativeDate } from '../../utils/helpers';

export default function AdminReports() {
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useAdminReports({ status });
  const resolveReport = useResolveReport();
  const dismissReport = useDismissReport();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'resolved', 'dismissed'].map((item) => (
          <Button key={item} variant={status === item ? 'primary' : 'secondary'} onClick={() => setStatus(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>
      {isLoading && <p>Loading...</p>}
      {!isLoading && data?.reports?.length === 0 && (
        <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm">All clear. No reports here.</div>
      )}
      <div className="space-y-3">
        {data?.reports?.map((report) => (
          <article key={report.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">Reported dua</h2>
              <span className="text-xs text-gray-400">{relativeDate(report.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{report.dua?.message}</p>
            <p className="mt-3 text-sm text-gray-500">Reason: {report.reason}</p>
            <p className="mt-1 text-sm text-gray-500">Sent to: @{report.dua?.owner?.username}</p>
            {status === 'pending' ? (
              <div className="mt-4 flex gap-2">
                <Button onClick={() => resolveReport.mutate({ id: report.id, hideDua: true })}>Resolve and hide dua</Button>
                <Button variant="secondary" onClick={() => dismissReport.mutate(report.id)}>Dismiss</Button>
              </div>
            ) : (
              <div className="mt-4"><Badge>{report.status}</Badge></div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
