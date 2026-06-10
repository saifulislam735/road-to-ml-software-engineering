import { useEffect, useState } from 'react';

export default function StatCard({ title, value = 0, color = 'blue', icon: Icon }) {
  const [count, setCount] = useState(0);
  const colors = {
    blue: 'text-blue-600 ring-blue-100',
    green: 'text-green-600 ring-green-100',
    orange: 'text-orange-600 ring-orange-100',
    red: 'text-red-600 ring-red-100'
  };

  useEffect(() => {
    const target = Number(value) || 0;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / 500, 1);
      setCount(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm ring-1 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} />}
        <p className="text-xs font-semibold uppercase text-gray-500">{title}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{count}</p>
    </div>
  );
}
