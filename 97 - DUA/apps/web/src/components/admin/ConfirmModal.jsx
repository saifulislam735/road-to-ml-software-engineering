import Button from '../ui/Button';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, isDanger, isLoading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={isDanger ? 'danger' : 'primary'} disabled={isLoading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
