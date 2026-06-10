import { useState } from 'react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

export default function BanModal({ isOpen, onClose, onConfirm, username, isLoading }) {
  const [reason, setReason] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">Ban @{username}</h2>
        <p className="mt-1 text-sm text-gray-500">This user will no longer be able to log in.</p>
        <Textarea className="mt-4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={reason.length < 10 || isLoading} onClick={() => onConfirm(reason)}>Ban user</Button>
        </div>
      </div>
    </div>
  );
}
