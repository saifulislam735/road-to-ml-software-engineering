import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { relativeDate } from '../utils/helpers';
import Button from './ui/Button';

export default function DuaCard({ dua, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {!dua.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
        <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left">
          <p className={expanded ? 'text-gray-800' : 'max-h-20 overflow-hidden text-gray-800'}>{dua.message}</p>
          <p className="mt-2 text-xs text-gray-400">{relativeDate(dua.createdAt)}</p>
        </button>
        {confirming ? (
          <div className="flex gap-1">
            <Button variant="danger" className="h-8 px-2" onClick={() => onDelete(dua.id)}>Yes</Button>
            <Button variant="secondary" className="h-8 px-2" onClick={() => setConfirming(false)}>No</Button>
          </div>
        ) : (
          <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => setConfirming(true)} aria-label="Delete dua">
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </article>
  );
}
