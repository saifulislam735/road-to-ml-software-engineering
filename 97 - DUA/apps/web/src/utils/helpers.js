import { formatDistanceToNow } from 'date-fns';

export function relativeDate(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function truncate(text = '', length = 80) {
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
