import type { FastifyPluginAsync } from 'fastify';
import { VersionResponseSchema } from '@oprino/contracts';

export const versionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/version', async (_req, reply) => {
    const payload = {
      name: 'oprino-api',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      gitCommit: '5fc3468',
      architecture: {
        framework: 'Fastify + TypeScript',
        database: 'PostgreSQL 18 + PostGIS 3.6',
        mobile: 'Flutter 3.47 Stable',
        auth: 'Better Auth (Bearer & Session Cookies)',
      },
    };

    const validated = VersionResponseSchema.parse(payload);
    return reply.status(200).send(validated);
  });
};
