import { Worker, type Job } from 'bullmq';
import { pino } from 'pino';
import { createRedisConnection } from './redis.js';
import { validateWorkerEnv } from './config/env.js';
import { createDatabaseClient } from '@oprino/database';

export function createWorkerManager(options?: {
  env?: Record<string, unknown>;
  logger?: boolean;
  dbClient?: ReturnType<typeof createDatabaseClient>;
}) {
  const env = validateWorkerEnv(options?.env);

  const logger = pino({
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
  });

  const connection = createRedisConnection(env.REDIS_URL);
  const dbClient = options?.dbClient ?? createDatabaseClient({ url: env.DATABASE_URL });

  // System jobs queue worker
  const worker = new Worker(
    'oprino-system-jobs',
    async (job: Job) => {
      logger.info({ jobId: job.id, jobName: job.name }, 'Processing system background job');

      if (job.name === 'telemetry.retention.prune') {
        const retentionDays = job.data?.retentionDays ?? 30;
        logger.info({ retentionDays }, 'Executing telemetry retention purge');

        const [result] = (await dbClient.client`
          SELECT telemetry_prune_expired_records(${retentionDays}) as deleted_count;
        `) as unknown as [{ deleted_count: number }];

        logger.info({ deletedCount: result?.deleted_count ?? 0 }, 'Telemetry retention purge complete');
        return { success: true, deletedCount: result?.deleted_count ?? 0 };
      }

      return { success: true, processedAt: new Date().toISOString() };
    },
    {
      connection,
      concurrency: env.CONCURRENCY,
    },
  );

  worker.on('ready', () => {
    logger.info('⚙️ BullMQ System Worker is ready and waiting for jobs');
  });

  worker.on('completed', (job: Job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Job completed successfully');
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
  });

  async function close() {
    logger.info('Shutting down worker and Redis connections...');
    await worker.close();
    await connection.quit();
    await dbClient.client.end();
  }

  return { worker, connection, logger, env, close };
}
