import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const VersionResponseSchema = z
  .object({
    name: z.string().openapi({ example: 'oprino-api' }),
    version: z.string().openapi({ example: '0.1.0' }),
    environment: z.string().openapi({ example: 'production' }),
    gitCommit: z.string().optional().openapi({ example: '5fc3468' }),
    architecture: z
      .object({
        framework: z.string().openapi({ example: 'Fastify + TypeScript' }),
        database: z.string().openapi({ example: 'PostgreSQL 18 + PostGIS 3.6' }),
        mobile: z.string().openapi({ example: 'Flutter 3.47 Stable' }),
        auth: z.string().openapi({ example: 'Better Auth' }),
      })
      .openapi('SystemArchitectureInfo'),
  })
  .openapi('VersionResponse');

export type VersionResponse = z.infer<typeof VersionResponseSchema>;
