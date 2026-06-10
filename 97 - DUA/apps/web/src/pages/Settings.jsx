import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { userApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { register, handleSubmit, formState } = useForm({ defaultValues: user || {} });

  async function onSubmit(data) {
    const response = await userApi.updateMe({ ...data, isPaused: Boolean(data.isPaused) });
    setUser(response.data);
    toast.success('Settings saved.');
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <Input placeholder="Name" {...register('name')} />
          <Input placeholder="Username" {...register('username')} />
          <Textarea placeholder="Bio" {...register('bio')} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isPaused')} />
            Pause receiving duas
          </label>
          <Button type="submit" disabled={formState.isSubmitting}>Save</Button>
        </form>
      </main>
    </>
  );
}
