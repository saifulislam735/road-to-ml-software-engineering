import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-4xl font-semibold text-gray-900">Dua Platform</h1>
          <p className="mt-3 text-gray-600">Receive duas from your loved ones, anonymously.</p>
        </div>
        <div className="grid gap-3 text-sm text-gray-600">
          <p>1. Create your profile.</p>
          <p>2. Share your profile link.</p>
          <p>3. Read anonymous duas in your inbox.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/register" className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700">
            Get started
          </Link>
          <Link to="/login" className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
