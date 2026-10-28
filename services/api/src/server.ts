import http from 'node:http';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { setupMetricsHooks } from './metrics.js';
import { metricsRoutes } from './routes/metrics.js';
import { validateEnv, type Env } from './config/env.js';
import { createDatabaseClient } from '@oprino/database';
import { createAuth } from './auth/better-auth.js';
import { WorkspaceService } from './services/workspace.service.js';
import { DeviceService } from './services/device.service.js';
import { TaskService } from './services/task.service.js';
import { AttendanceService } from './services/attendance.service.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { healthRoutes } from './routes/health.js';
import { versionRoutes } from './routes/version.js';
import { openapiRoutes } from './routes/openapi.js';
import { authRoutes } from './routes/auth.js';
import { workspaceRoutes } from './routes/workspaces.js';
import { meRoutes } from './routes/me.js';
import { deviceRoutes } from './routes/devices.js';
import { taskRoutes } from './routes/tasks.js';
import { attendanceRoutes } from './routes/attendance.js';
import { telemetryRoutes } from './routes/telemetry.js';
import { geofencesRoutes } from './routes/geofences.js';
import { customerRoutes } from './routes/customers.js';
import { visitRoutes } from './routes/visits.js';
import { mediaRoutes } from './routes/media.js';
import { CustomerService } from './services/customer.service.js';
import { VisitService } from './services/visit.service.js';
import { MediaService } from './services/media.service.js';
import { TelemetryService } from './services/telemetry.service.js';
import { PubSubService } from './services/pubsub.service.js';
import { SyncService } from './services/sync.service.js';
import { SchedulingService } from './services/scheduling.service.js';
import { ReportService } from './services/report.service.js';
import { NotificationService } from './services/notification.service.js';
import { syncRoutes } from './routes/sync.js';
import { schedulingRoutes } from './routes/scheduling.js';
import { reportRoutes } from './routes/reports.js';
import { notificationRoutes } from './routes/notifications.js';
import { createStorageDriver, type StorageDriver } from './storage/index.js';

export function buildServer(options?: {
  env?: Record<string, unknown>;
  logger?: boolean;
  dbClient?: ReturnType<typeof createDatabaseClient>;
  storageDriver?: StorageDriver;
}): {
  app: FastifyInstance;
  env: Env;
  dbClient: ReturnType<typeof createDatabaseClient>;
  workspaceService: WorkspaceService;
  deviceService: DeviceService;
  taskService: TaskService;
  attendanceService: AttendanceService;
  telemetryService: TelemetryService;
  customerService: CustomerService;
  visitService: VisitService;
  mediaService: MediaService;
  storageDriver: StorageDriver;
  syncService: SyncService;
  schedulingService: SchedulingService;
  reportService: ReportService;
  notificationService: NotificationService;
  pubsub: PubSubService;
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
  const pubsub = new PubSubService(env.REDIS_URL);
  const deviceService = new DeviceService(dbClient.db);
  const workspaceService = new WorkspaceService(dbClient.db);
  const taskService = new TaskService(dbClient.db);
  const storageDriver = options?.storageDriver ?? createStorageDriver(env);
  const mediaService = new MediaService(dbClient.db, storageDriver, env.API_PUBLIC_URL);
  const attendanceService = new AttendanceService(dbClient.db, mediaService);
  const telemetryService = new TelemetryService(dbClient.db, pubsub);
  const customerService = new CustomerService(dbClient.db);
  const visitService = new VisitService(dbClient.db);
  const syncService = new SyncService(dbClient.db);
  const schedulingService = new SchedulingService(dbClient.db);
  const reportService = new ReportService(dbClient.db);
  const notificationService = new NotificationService(dbClient.db);
  const authMiddleware = createAuthMiddleware(auth, deviceService, dbClient.db);

  // Close connections on Fastify shutdown
  app.addHook('onClose', async () => {
    await pubsub.close();
    await dbClient.client.end();
  });

  // Hardened Security Plugins
  app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // 1. Explicit approved origins wherever feasible (production web, staging, official previews, and native mobile scheme)
  const explicitApprovedOrigins = [
    'https://oprino.vercel.app',
    'https://oprino-staging.vercel.app',
    'https://oprino-preview.vercel.app',
    'https://oprino-git-main-djsushilkumar.vercel.app',
    'oprino://app',
  ];

  const allowedOrigins: (string | RegExp)[] = [...explicitApprovedOrigins];

  // Dynamic preview deployments: used where static origin declaration is not feasible due to dynamic branch names.
  // Strictly scoped to the verified team namespace (-djsushilkumar) to reject third-party prefix squatting.
  allowedOrigins.push(
    /^https:\/\/oprino-[a-zA-Z0-9_-]+-djsushilkumar(?:-[a-zA-Z0-9]+)?\.vercel\.app$/,
  );

  if (env.APP_PUBLIC_URL) {
    try {
      allowedOrigins.push(new URL(env.APP_PUBLIC_URL).origin);
    } catch {
      allowedOrigins.push(env.APP_PUBLIC_URL);
    }
  }

  if (env.API_PUBLIC_URL) {
    try {
      allowedOrigins.push(new URL(env.API_PUBLIC_URL).origin);
    } catch {
      allowedOrigins.push(env.API_PUBLIC_URL);
    }
  }

  if (env.NODE_ENV !== 'production' && env.APP_ENV !== 'production') {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    );
  }

  // Explicitly controlled preview origins configured via CORS_ORIGINS
  if (env.CORS_ORIGINS) {
    const extraOrigins = env.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .filter((o) => {
        if (o === '*') {
          app.log.warn(
            '⚠️ Wildcard CORS origin "*" ignored when credentials: true is enabled for cross-origin security.',
          );
          return false;
        }
        return true;
      });
    allowedOrigins.push(...extraOrigins);
  }

  app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => {
      const authUser = (req as any).user?.id;
      const deviceId = (req as any).deviceInstallationId;
      return authUser || deviceId || req.ip;
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
    }),
  });

  app.register(sensible);

  // Observability & Metrics
  if (env.ENABLE_PROMETHEUS) {
    setupMetricsHooks(app);
    app.register(metricsRoutes);
  }

  // System Routes
  app.register(healthRoutes, { dbClient, pubsub, isTest: env.NODE_ENV === 'test' });
  app.register(versionRoutes);
  app.register(openapiRoutes);

  // Auth & Identity Routes
  app.register(authRoutes, {
    auth,
    db: dbClient.db,
    workspaceService,
    betterAuthUrl: env.BETTER_AUTH_URL,
  });
  app.register(workspaceRoutes, {
    workspaceService,
    authMiddleware,
    auth,
    appPublicUrl: env.APP_PUBLIC_URL,
  });
  app.register(meRoutes, { db: dbClient.db, authMiddleware });
  app.register(deviceRoutes, { deviceService, authMiddleware });

  // Phase 02B Core Operational Routes
  app.register(taskRoutes, { taskService, mediaService, authMiddleware });
  app.register(attendanceRoutes, { attendanceService, authMiddleware });

  // Phase 02C Location Telemetry & Geofencing Routes
  app.register(telemetryRoutes, { telemetryService, pubsub, authMiddleware });
  app.register(geofencesRoutes, { telemetryService, authMiddleware });

  // Phase 03 Field Operations, Visits & Media Routes
  app.register(customerRoutes, { customerService, authMiddleware });
  app.register(visitRoutes, { visitService, authMiddleware });
  app.register(mediaRoutes, { mediaService, authMiddleware });

  // Phase 04 Advanced Operations Routes
  app.register(syncRoutes, { syncService, authMiddleware });
  app.register(schedulingRoutes, { schedulingService, authMiddleware });
  app.register(reportRoutes, { reportService, authMiddleware });
  app.register(notificationRoutes, { notificationService, authMiddleware });

  // Security-hardened error handler: suppress stack traces and internal errors in production
  app.setErrorHandler((error: any, request, reply) => {
    const statusCode =
      error.statusCode && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;
    const isProduction =
      env.NODE_ENV === 'production' || env.APP_ENV === 'production' || env.APP_ENV === 'staging';

    request.log.error(error);

    if (statusCode === 500 && isProduction) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected internal error occurred.',
      });
    }

    const errorTitle =
      error.error ||
      (http.STATUS_CODES[statusCode] ? http.STATUS_CODES[statusCode] : error.name || 'Error');

    const responsePayload: Record<string, any> = {
      statusCode,
      error: errorTitle,
      message: error.message,
    };

    if (!isProduction && error.stack) {
      responsePayload.stack = error.stack;
    }

    return reply.status(statusCode).send(responsePayload);
  });

  // Deterministic resource teardown on server shutdown
  app.addHook('onClose', async () => {
    await pubsub.close();
    if (!options?.dbClient) {
      await dbClient.client.end({ timeout: 5 });
    }
  });

  return {
    app,
    env,
    dbClient,
    workspaceService,
    deviceService,
    taskService,
    attendanceService,
    telemetryService,
    customerService,
    visitService,
    mediaService,
    storageDriver,
    syncService,
    schedulingService,
    reportService,
    notificationService,
    pubsub,
  };
}
