import Button from '../ui/Button';

export default function AdminTable({ isLoading, error, isEmpty, emptyMessage, pagination, onPageChange, children }) {
  if (isLoading) {
    return <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow-sm">Loading...</div>;
  }
  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load data.</div>;
  }
  if (isEmpty) {
    return <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm">{emptyMessage}</div>;
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">{children}</div>
      {pagination && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages || 1}</span>
          <Button variant="secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
