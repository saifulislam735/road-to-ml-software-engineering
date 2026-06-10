import { z } from 'zod';

export const banUserSchema = z.object({
  reason: z.string().min(10).max(500)
});

export const resolveReportSchema = z.object({
  hideDua: z.boolean().default(false)
});
