import { z } from 'zod';

export const updateMeSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  name: z.string().max(80).nullable().optional(),
  bio: z.string().max(240).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isPaused: z.boolean().optional()
});
