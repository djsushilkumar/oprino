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

      if (job.name === 'tasks.recurring.generate') {
        const workspaceId = job.data?.workspaceId;
        logger.info({ workspaceId }, 'Executing recurring task generation');

        const now = new Date();
        const templates = await dbClient.client`
          SELECT * FROM recurring_task_templates
          WHERE is_active = true AND next_run_at <= ${now.toISOString()}
          ${workspaceId ? dbClient.client`AND workspace_id = ${workspaceId}::uuid` : dbClient.client``}
        `;

        let generated = 0;
        for (const t of (templates as any[])) {
          // 1. Insert Task with ASSIGNED status
          const [newTask] = (await dbClient.client`
            INSERT INTO tasks (workspace_id, title, description, status, priority, customer_id, site_id, requires_signature, requires_photo_proof, created_by)
            VALUES (${t.workspace_id}, ${t.title}, ${t.description}, 'ASSIGNED', ${t.priority}, ${t.customer_id}, ${t.site_id}, ${t.requires_signature}, ${t.requires_photo_proof}, ${t.created_by})
            RETURNING id;
          `) as unknown as [{ id: string }];

          // 2. Copy Assignees
          const assigneeIds: string[] = Array.isArray(t.assignee_ids)
            ? t.assignee_ids
            : typeof t.assignee_ids === 'string'
              ? JSON.parse(t.assignee_ids)
              : [];

          for (const uid of assigneeIds) {
            await dbClient.client`
              INSERT INTO task_assignees (workspace_id, task_id, user_id, assigned_by)
              VALUES (${t.workspace_id}, ${newTask.id}, ${uid}, ${t.created_by})
              ON CONFLICT DO NOTHING;
            `;
          }

          // 3. Copy Checklist Items
          const checklist: Array<{ title: string; sort_order?: number; sortOrder?: number }> =
            Array.isArray(t.checklist_template)
              ? t.checklist_template
              : typeof t.checklist_template === 'string'
                ? JSON.parse(t.checklist_template)
                : [];

          for (let i = 0; i < checklist.length; i++) {
            const itemTitle = checklist[i].title;
            const sortOrder = checklist[i].sort_order ?? checklist[i].sortOrder ?? i;
            if (itemTitle) {
              await dbClient.client`
                INSERT INTO task_checklist_items (workspace_id, task_id, title, sort_order)
                VALUES (${t.workspace_id}, ${newTask.id}, ${itemTitle}, ${sortOrder});
              `;
            }
          }

          // 4. Record Task Activity
          const activityDetails = JSON.stringify({
            templateId: t.id,
            generatedAt: now.toISOString(),
          });
          await dbClient.client`
            INSERT INTO task_activity (workspace_id, task_id, actor_id, action, details)
            VALUES (${t.workspace_id}, ${newTask.id}, ${t.created_by}, 'task.recurring_generated', ${activityDetails}::jsonb);
          `;

          // 5. Advance next_run_at
          const nextRun = new Date(now);
          if (t.recurrence_frequency === 'WEEKLY') {
            nextRun.setDate(nextRun.getDate() + 7 * (t.recurrence_interval || 1));
          } else if (t.recurrence_frequency === 'MONTHLY') {
            nextRun.setMonth(nextRun.getMonth() + (t.recurrence_interval || 1));
          } else {
            nextRun.setDate(nextRun.getDate() + (t.recurrence_interval || 1));
          }

          await dbClient.client`
            UPDATE recurring_task_templates
            SET last_run_at = ${now.toISOString()}, next_run_at = ${nextRun.toISOString()}, updated_at = ${now.toISOString()}
            WHERE id = ${t.id};
          `;

          generated++;
        }

        logger.info({ generatedCount: generated }, 'Recurring task generation complete');
        return { success: true, generatedCount: generated };
      }

      if (job.name === 'tasks.sla.check_overdue') {
        const now = new Date();
        logger.info('Executing task SLA overdue monitor');

        const overdueTasks = (await dbClient.client`
          SELECT t.id, t.workspace_id, t.title, a.user_id
          FROM tasks t
          LEFT JOIN task_assignees a ON t.id = a.task_id
          WHERE t.due_at < ${now.toISOString()}
            AND t.status NOT IN ('COMPLETED', 'VERIFIED')
          LIMIT 100;
        `) as unknown as Array<{ id: string; workspace_id: string; title: string; user_id: string | null }>;

        let notified = 0;
        for (const ot of overdueTasks) {
          if (ot.user_id) {
            // Deduplication check: only insert if no TASK_OVERDUE notification exists within the last 24h
            const [existing] = (await dbClient.client`
              SELECT id FROM notifications
              WHERE workspace_id = ${ot.workspace_id}
                AND user_id = ${ot.user_id}
                AND type = 'TASK_OVERDUE'
                AND entity_id = ${ot.id}
                AND created_at >= NOW() - INTERVAL '24 hours'
              LIMIT 1;
            `) as unknown as Array<{ id: string }>;

            if (!existing) {
              await dbClient.client`
                INSERT INTO notifications (workspace_id, user_id, type, title, body, entity_type, entity_id)
                VALUES (${ot.workspace_id}, ${ot.user_id}, 'TASK_OVERDUE', 'Task Overdue SLA Alert', ${'Task "' + ot.title + '" is past its scheduled due date.'}, 'task', ${ot.id});
              `;
              notified++;
            }
          }
        }

        logger.info({ overdueCount: overdueTasks.length, notifiedCount: notified }, 'Overdue SLA monitor complete');
        return { success: true, notifiedCount: notified };
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
