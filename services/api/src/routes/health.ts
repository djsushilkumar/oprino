import type { FastifyPluginAsync } from 'fastify';
import { HealthResponseSchema, LivenessResponseSchema } from '@oprino/contracts';
import type { createDatabaseClient } from '@oprino/database';
import type { PubSubService } from '../services/pubsub.service.js';

export interface HealthRouteOptions {
  dbClient?: ReturnType<typeof createDatabaseClient>;
  pubsub?: PubSubService;
  isTest?: boolean;
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (app, options) => {
  const { dbClient, pubsub, isTest } = options;
  const isTestMode = isTest ?? process.env.NODE_ENV === 'test';

  async function checkServicesHealth() {
    let dbStatus: 'connected' | 'disconnected' | 'unhealthy' = 'connected';
    let redisStatus: 'connected' | 'disconnected' | 'unhealthy' = 'connected';

    if (isTestMode) {
      dbStatus = 'connected';
      redisStatus = 'connected';
    } else {
      // Probe Database connection pool
      if (dbClient) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DB health query timed out')), 2000),
          );
          const queryPromise = dbClient.client`SELECT 1 as alive;`;
          await Promise.race([queryPromise, timeoutPromise]);
          dbStatus = 'connected';
        } catch (err) {
          app.log.warn({ err }, 'Health check database query failure');
          dbStatus = 'disconnected';
        }
      }

      // Probe Redis connectivity
      if (pubsub) {
        try {
          const isRedisOk = await pubsub.checkHealth();
          redisStatus = isRedisOk ? 'connected' : 'disconnected';
        } catch (err) {
          app.log.warn({ err }, 'Health check Redis ping failure');
          redisStatus = 'disconnected';
        }
      }
    }

    const overallStatus: 'ok' | 'degraded' | 'unhealthy' =
      dbStatus === 'connected' && redisStatus === 'connected'
        ? 'ok'
        : dbStatus === 'connected' || redisStatus === 'connected'
          ? 'degraded'
          : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  // General Health Check
  app.get('/health', async (_req, reply) => {
    const payload = await checkServicesHealth();
    const validated = HealthResponseSchema.parse(payload);
    const statusCode = payload.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(validated);
  });

  // Liveness Probes
  const handleLiveness = async (_req: any, reply: any) => {
    const payload = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    };
    const validated = LivenessResponseSchema.parse(payload);
    return reply.status(200).send(validated);
  };

  app.get('/health/live', handleLiveness);
  app.get('/health/liveness', handleLiveness);

  // Deep Readiness Probes
  const handleReadiness = async (_req: any, reply: any) => {
    const payload = await checkServicesHealth();
    const validated = HealthResponseSchema.parse(payload);
    const statusCode = payload.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(validated);
  };

  app.get('/health/ready', handleReadiness);
  app.get('/health/readiness', handleReadiness);
};
