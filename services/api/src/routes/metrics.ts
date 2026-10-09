import type { FastifyPluginAsync } from 'fastify';
import { register } from '../metrics.js';

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    return reply.status(200).send(metricsData);
  });
};
