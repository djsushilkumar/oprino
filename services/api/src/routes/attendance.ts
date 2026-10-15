import type { FastifyPluginAsync } from 'fastify';
import type { AttendanceService } from '../services/attendance.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';
import {
  PunchInRequestSchema,
  PunchOutRequestSchema,
  CreateShiftRequestSchema,
} from '@oprino/contracts';

export interface AttendanceRoutesOptions {
  attendanceService: AttendanceService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const attendanceRoutes: FastifyPluginAsync<AttendanceRoutesOptions> = async (app, options) => {
  const { attendanceService, authMiddleware } = options;

  // POST /v1/attendance/punch-in - Duty Start
  app.post(
    '/v1/attendance/punch-in',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_SELF_PUNCH),
      ],
    },
    async (req, reply) => {
      const parsed = PunchInRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid punch-in payload',
          details: parsed.error.issues,
        });
      }

      try {
        const session = await attendanceService.punchIn(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(200).send(session);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || (status === 400 ? 'Bad Request' : 'Internal Server Error'),
          message: err.message || 'Failed to punch in',
        });
      }
    },
  );

  // POST /v1/attendance/punch-out - Duty End
  app.post(
    '/v1/attendance/punch-out',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_SELF_PUNCH),
      ],
    },
    async (req, reply) => {
      const parsed = PunchOutRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid punch-out payload',
          details: parsed.error.issues,
        });
      }

      try {
        const session = await attendanceService.punchOut(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(200).send(session);
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: status === 400 ? 'Bad Request' : 'Internal Server Error',
          message: err.message || 'Failed to punch out',
        });
      }
    },
  );

  // GET /v1/attendance/current - Current Duty State
  app.get(
    '/v1/attendance/current',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_SELF_READ),
      ],
    },
    async (req, reply) => {
      try {
        const current = await attendanceService.getCurrentAttendance(
          req.workspaceId!,
          req.user!.id,
        );
        return reply.status(200).send(current);
      } catch (err: any) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve current attendance state',
        });
      }
    },
  );

  // GET /v1/attendance/history - User Attendance History
  app.get(
    '/v1/attendance/history',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_SELF_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { limit?: string; offset?: string };
        const limit = query.limit ? parseInt(query.limit, 10) : 50;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;

        const history = await attendanceService.getAttendanceHistory(
          req.workspaceId!,
          req.user!.id,
          limit,
          offset,
        );
        return reply.status(200).send(history);
      } catch (err: any) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve attendance history',
        });
      }
    },
  );

  // GET /v1/attendance/team - Team Attendance Overview (Managers/Admins)
  app.get(
    '/v1/attendance/team',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_TEAM_READ),
      ],
    },
    async (req, reply) => {
      try {
        const team = await attendanceService.getTeamAttendance(req.workspaceId!);
        return reply.status(200).send(team);
      } catch (err: any) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve team attendance',
        });
      }
    },
  );

  // POST /v1/attendance/shifts - Create Shift Schedule
  app.post(
    '/v1/attendance/shifts',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = CreateShiftRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid shift payload',
          details: parsed.error.issues,
        });
      }

      try {
        const shift = await attendanceService.createShift(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );
        return reply.status(201).send(shift);
      } catch (err: any) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to create shift',
        });
      }
    },
  );

  // GET /v1/attendance/shifts - List Active Shifts
  app.get(
    '/v1/attendance/shifts',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_SELF_READ),
      ],
    },
    async (req, reply) => {
      try {
        const shifts = await attendanceService.listShifts(req.workspaceId!);
        return reply.status(200).send(shifts);
      } catch (err: any) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to list shifts',
        });
      }
    },
  );
};
