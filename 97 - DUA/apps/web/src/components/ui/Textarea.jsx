export default function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`min-h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
  );
}
