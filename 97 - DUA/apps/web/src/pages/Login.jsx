import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    try {
      const response = await authApi.login(data);
      login(response.data.token, response.data.user);
      navigate('/inbox');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <Input placeholder="Email" {...register('email')} />
        {formState.errors.email && <p className="text-sm text-red-600">{formState.errors.email.message}</p>}
        <Input type="password" placeholder="Password" {...register('password')} />
        {formState.errors.password && <p className="text-sm text-red-600">{formState.errors.password.message}</p>}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>Log in</Button>
        <p className="text-center text-sm text-gray-500">
          Need an account? <Link className="text-brand-700" to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}
