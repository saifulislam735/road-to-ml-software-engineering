export default function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700'
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
