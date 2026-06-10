import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import DuaForm from '../components/DuaForm';
import { userApi } from '../services/api';

export default function PublicProfile() {
  const { username } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userApi.getProfile(username).then((response) => response.data)
  });

  if (isLoading) return <main className="mx-auto max-w-lg px-4 py-10">Loading...</main>;
  if (error) return <main className="mx-auto max-w-lg px-4 py-10">Profile not found.</main>;

  document.title = `Send a dua to ${data.name || data.username}`;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <section className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar user={data} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold">{data.name || data.username}</h1>
            <p className="text-sm text-gray-500">@{data.username}</p>
          </div>
        </div>
        {data.bio && <p className="text-gray-600">{data.bio}</p>}
        {data.isPaused ? <p>This user is not accepting duas right now.</p> : <DuaForm username={username} />}
      </section>
    </main>
  );
}
