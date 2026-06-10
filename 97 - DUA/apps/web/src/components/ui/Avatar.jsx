export default function Avatar({ user, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' };
  const label = (user?.name || user?.username || '?').slice(0, 2).toUpperCase();
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700`}>
      {label}
    </div>
  );
}
