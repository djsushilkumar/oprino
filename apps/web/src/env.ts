import { z } from 'zod';

export const WebEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('https://oprino-api.onrender.com'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
});

export const env = WebEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});
