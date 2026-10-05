import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { validateEnv, type Env } from './config/env.js';
import { createDatabaseClient } from '@oprino/database';
import { createAuth } from './auth/better-auth.js';
import { WorkspaceService } from './services/workspace.service.js';
import { DeviceService } from './services/device.service.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { healthRoutes } from './routes/health.js';
import { versionRoutes } from './routes/version.js';
import { openapiRoutes } from './routes/openapi.js';
import { authRoutes } from './routes/auth.js';
import { workspaceRoutes } from './routes/workspaces.js';
import { meRoutes } from './routes/me.js';
import { deviceRoutes } from './routes/devices.js';

export function buildServer(options?: {
  env?: Record<string, unknown>;
  logger?: boolean;
  dbClient?: ReturnType<typeof createDatabaseClient>;
}): {
  app: FastifyInstance;
  env: Env;
  dbClient: ReturnType<typeof createDatabaseClient>;
  workspaceService: WorkspaceService;
  deviceService: DeviceService;
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

  // Database & Services Setup
  const dbClient = options?.dbClient ?? createDatabaseClient({ url: env.DATABASE_URL });
  const auth = createAuth(env, dbClient);
  const deviceService = new DeviceService(dbClient.db);
  const workspaceService = new WorkspaceService(dbClient.db);
  const authMiddleware = createAuthMiddleware(auth, deviceService, dbClient.db);

  // Close DB connections on Fastify shutdown
  app.addHook('onClose', async () => {
    await dbClient.client.end();
  });

  // Plugins
  app.register(cors, {
    origin: [
      env.API_PUBLIC_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'oprino://app',
    ],
    credentials: true,
  });

  app.register(sensible);

  // System Routes
  app.register(healthRoutes);
  app.register(versionRoutes);
  app.register(openapiRoutes);

  // Auth & Identity Routes
  app.register(authRoutes, { auth, db: dbClient.db });
  app.register(workspaceRoutes, { workspaceService, authMiddleware });
  app.register(meRoutes, { db: dbClient.db, authMiddleware });
  app.register(deviceRoutes, { deviceService, authMiddleware });

  return { app, env, dbClient, workspaceService, deviceService };
}
