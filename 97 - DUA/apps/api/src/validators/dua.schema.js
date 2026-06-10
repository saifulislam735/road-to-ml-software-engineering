import { z } from 'zod';

export const sendDuaSchema = z.object({
  message: z.string().min(10).max(500)
});

export const reportDuaSchema = z.object({
  reason: z.string().min(10).max(300)
});
