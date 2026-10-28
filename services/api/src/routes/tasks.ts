import type { FastifyPluginAsync } from 'fastify';
import type { TaskService } from '../services/task.service.js';
import type { MediaService } from '../services/media.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  TaskTransitionRequestSchema,
  VerifyTaskRequestSchema,
  CreateChecklistItemRequestSchema,
  UpdateChecklistItemRequestSchema,
  CreateTaskCommentRequestSchema,
} from '@oprino/contracts';

export interface TaskRoutesOptions {
  taskService: TaskService;
  mediaService?: MediaService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const taskRoutes: FastifyPluginAsync<TaskRoutesOptions> = async (app, options) => {
  const { taskService, mediaService, authMiddleware } = options;

  // POST /v1/tasks - Create Task
  app.post(
    '/v1/tasks',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_CREATE),
      ],
    },
    async (req, reply) => {
      const parsed = CreateTaskRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid task payload',
          details: parsed.error.issues,
        });
      }

      try {
        const task = await taskService.createTask(
          req.workspaceId!,
          req.user!.id,
          req.user!.name,
          parsed.data,
        );
        return reply.status(201).send(task);
      } catch (err: any) {
        req.log.error(err, 'Failed to create task');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to create task',
        });
      }
    },
  );

  // GET /v1/tasks - List Tasks with filtering
  app.get(
    '/v1/tasks',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as Record<string, string>;

        // If employee role without tasks.assign or tasks.create, restrict to assigned tasks
        const hasManagerScope =
          req.permissions?.includes(PERMISSIONS.TASKS_CREATE) ||
          req.permissions?.includes(PERMISSIONS.TASKS_ASSIGN);
        const restrictToAssigneeId = hasManagerScope ? undefined : req.user!.id;

        const result = await taskService.listTasks(req.workspaceId!, query, restrictToAssigneeId);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list tasks');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve tasks',
        });
      }
    },
  );

  // GET /v1/tasks/:taskId - Get Task Details
  app.get(
    '/v1/tasks/:taskId',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_READ),
      ],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      try {
        const task = await taskService.getTaskById(req.workspaceId!, taskId);
        return reply.status(200).send(task);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to retrieve task',
        });
      }
    },
  );

  // PATCH /v1/tasks/:taskId - Update Task
  app.patch(
    '/v1/tasks/:taskId',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_UPDATE),
      ],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      const parsed = UpdateTaskRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid task update payload',
          details: parsed.error.issues,
        });
      }

      try {
        const canAssign = req.permissions?.includes(PERMISSIONS.TASKS_ASSIGN) ?? false;
        const task = await taskService.updateTask(
          req.workspaceId!,
          taskId,
          req.user!.id,
          req.user!.name,
          parsed.data,
          canAssign,
        );
        return reply.status(200).send(task);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 409
              ? 'Conflict'
              : status === 400
                ? 'Bad Request'
                : status === 403
                  ? 'Forbidden'
                  : 'Internal Server Error',
          message: err.message || 'Failed to update task',
        });
      }
    },
  );

  // POST /v1/tasks/:taskId/transition - Transition Task Status
  app.post(
    '/v1/tasks/:taskId/transition',
    {
      preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      const parsed = TaskTransitionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid transition payload',
          details: parsed.error.issues,
        });
      }

      try {
        const task = await taskService.transitionTask(
          req.workspaceId!,
          taskId,
          req.user!.id,
          req.permissions ?? [],
          parsed.data.status,
          parsed.data.version,
          parsed.data.comment,
        );
        return reply.status(200).send(task);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 409
              ? 'Conflict'
              : status === 400
                ? 'Bad Request'
                : status === 403
                  ? 'Forbidden'
                  : 'Internal Server Error',
          message: err.message || 'Failed to transition task',
        });
      }
    },
  );

  // POST /v1/tasks/:taskId/checklist - Add Checklist Item
  app.post(
    '/v1/tasks/:taskId/checklist',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_UPDATE),
      ],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      const parsed = CreateChecklistItemRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid checklist item payload',
          details: parsed.error.issues,
        });
      }

      try {
        const item = await taskService.addChecklistItem(
          req.workspaceId!,
          taskId,
          parsed.data.title,
          parsed.data.sortOrder ?? 0,
        );
        return reply.status(201).send(item);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: 'Internal Server Error',
          message: err.message || 'Failed to add checklist item',
        });
      }
    },
  );

  // PATCH /v1/tasks/:taskId/checklist/:itemId - Update Checklist Item Completion
  app.patch(
    '/v1/tasks/:taskId/checklist/:itemId',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_UPDATE),
      ],
    },
    async (req, reply) => {
      const { taskId, itemId } = req.params as { taskId: string; itemId: string };
      const parsed = UpdateChecklistItemRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid checklist update payload',
          details: parsed.error.issues,
        });
      }

      try {
        const item = await taskService.updateChecklistItem(
          req.workspaceId!,
          taskId,
          itemId,
          req.user!.id,
          parsed.data.isCompleted,
        );
        return reply.status(200).send(item);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to update checklist item',
        });
      }
    },
  );

  // POST /v1/tasks/:taskId/comments - Add Comment
  app.post(
    '/v1/tasks/:taskId/comments',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_READ),
      ],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      const parsed = CreateTaskCommentRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid comment payload',
          details: parsed.error.issues,
        });
      }

      try {
        const comment = await taskService.addComment(
          req.workspaceId!,
          taskId,
          req.user!.id,
          parsed.data.content,
        );
        return reply.status(201).send(comment);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: 'Internal Server Error',
          message: err.message || 'Failed to add comment',
        });
      }
    },
  );

  // POST /v1/tasks/:taskId/verify - Verify or reject task (Manager/Supervisor queue)
  app.post(
    '/v1/tasks/:taskId/verify',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_VERIFY),
      ],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      const parsed = VerifyTaskRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid verification payload',
          details: parsed.error.issues,
        });
      }

      try {
        const task = await taskService.verifyTask(
          req.workspaceId!,
          taskId,
          req.user!.id,
          parsed.data.action,
          parsed.data.notes,
        );
        return reply.status(200).send(task);
      } catch (err: any) {
        req.log.error(err, 'Failed to verify task');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error:
            status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Internal Server Error',
          message: err.message || 'Failed to verify task',
        });
      }
    },
  );

  // GET /v1/tasks/:taskId/proofs - List proofs of work for task
  app.get(
    '/v1/tasks/:taskId/proofs',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_READ),
      ],
    },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      try {
        if (!mediaService) {
          return reply.status(200).send({ proofs: [] });
        }
        const result = await mediaService.listTaskProofs(req.workspaceId!, taskId);
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to list task proofs');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: 'Internal Server Error',
          message: err.message || 'Failed to list task proofs',
        });
      }
    },
  );
};
