export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };
  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
