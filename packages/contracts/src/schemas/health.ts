import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const HealthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded', 'unhealthy']).openapi({ example: 'ok' }),
    timestamp: z.string().datetime().openapi({ example: '2026-10-05T12:00:00.000Z' }),
    services: z
      .object({
        database: z
          .enum(['connected', 'disconnected', 'unhealthy'])
          .openapi({ example: 'connected' }),
        redis: z.enum(['connected', 'disconnected', 'unhealthy']).openapi({ example: 'connected' }),
      })
      .openapi({ description: 'Subsystem connectivity health' }),
  })
  .openapi('HealthResponse');

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
