import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useSendDua } from '../hooks/useDuas';
import Button from './ui/Button';
import Textarea from './ui/Textarea';

const schema = z.object({
  message: z.string().min(10, 'Write at least 10 characters.').max(500, 'Keep it under 500 characters.')
});

export default function DuaForm({ username }) {
  const mutation = useSendDua(username);
  const { register, handleSubmit, watch, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { message: '' }
  });
  const message = watch('message');

  async function onSubmit(data) {
    try {
      await mutation.mutateAsync(data);
      toast.success('Dua sent.');
    } catch (error) {
      toast.error(error.response?.status === 429 ? 'Too many duas. Try again later.' : 'Could not send dua.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea placeholder="Write a dua..." maxLength={500} {...register('message')} />
      {formState.errors.message && <p className="text-sm text-red-600">{formState.errors.message.message}</p>}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Your message is anonymous</span>
        <span>{message.length} / 500</span>
      </div>
      <Button type="submit" disabled={mutation.isPending}>Send dua</Button>
    </form>
  );
}
