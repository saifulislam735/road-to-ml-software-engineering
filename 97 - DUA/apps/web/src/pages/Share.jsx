import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { copyToClipboard } from '../utils/helpers';

export default function Share() {
  const user = useAuthStore((state) => state.user);
  const url = `${import.meta.env.VITE_APP_URL || window.location.origin}/u/${user?.username}`;
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-6">
        <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Share your link</h1>
          <p className="break-all rounded-lg bg-gray-50 p-3 text-sm">{url}</p>
          <Button onClick={() => copyToClipboard(url).then(() => toast.success('Copied.'))}>Copy link</Button>
          <p className="text-sm text-gray-500">Share this link on Instagram Stories or Messenger Day.</p>
        </section>
      </main>
    </>
  );
}
