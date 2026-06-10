export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
  );
}
