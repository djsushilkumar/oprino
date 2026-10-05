import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ApiErrorSchema = z
  .object({
    statusCode: z.number().int().openapi({ example: 400 }),
    error: z.string().openapi({ example: 'Bad Request' }),
    message: z.string().openapi({ example: 'Invalid request payload' }),
    details: z.array(z.record(z.unknown())).optional(),
  })
  .openapi('ApiError');

export type ApiError = z.infer<typeof ApiErrorSchema>;
