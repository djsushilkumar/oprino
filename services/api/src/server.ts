import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { validateEnv, type Env } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { versionRoutes } from './routes/version.js';
import { openapiRoutes } from './routes/openapi.js';
import { authRoutes } from './routes/auth.js';

export function buildServer(options?: { env?: Record<string, unknown>; logger?: boolean }): {
  app: FastifyInstance;
  env: Env;
} {
  const env = validateEnv(options?.env);

  const app = Fastify({
    logger: options?.logger ?? {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Plugins
  app.register(cors, {
    origin: [env.API_PUBLIC_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'oprino://app'],
    credentials: true,
  });

  app.register(sensible);

  // Routes
  app.register(healthRoutes);
  app.register(versionRoutes);
  app.register(openapiRoutes);
  app.register(authRoutes);

  return { app, env };
}
