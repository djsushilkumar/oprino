import type { FastifyPluginAsync } from 'fastify';
import { HealthResponseSchema } from '@oprino/contracts';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_req, reply) => {
    const payload = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected' as const,
        redis: 'connected' as const,
      },
    };

    const validated = HealthResponseSchema.parse(payload);
    return reply.status(200).send(validated);
  });
};
