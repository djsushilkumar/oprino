import type { FastifyPluginAsync } from 'fastify';
import type { ReportService } from '../services/report.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { PERMISSIONS } from '../auth/permissions.js';

export interface ReportRoutesOptions {
  reportService: ReportService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const reportRoutes: FastifyPluginAsync<ReportRoutesOptions> = async (app, options) => {
  const { reportService, authMiddleware } = options;

  // GET /v1/reports/attendance - Attendance summary report
  app.get(
    '/v1/reports/attendance',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_TEAM_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { startDate?: string; endDate?: string };
        const report = await reportService.getAttendanceReport(
          req.workspaceId!,
          query.startDate,
          query.endDate,
        );
        return reply.status(200).send(report);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate attendance report');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to generate attendance report',
        });
      }
    },
  );

  // GET /v1/reports/tasks - Task SLA performance report
  app.get(
    '/v1/reports/tasks',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.TASKS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { startDate?: string; endDate?: string };
        const report = await reportService.getTaskSlaReport(
          req.workspaceId!,
          query.startDate,
          query.endDate,
        );
        return reply.status(200).send(report);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate task SLA report');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to generate task SLA report',
        });
      }
    },
  );

  // GET /v1/reports/visits - Customer visit audit report
  app.get(
    '/v1/reports/visits',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.VISITS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { startDate?: string; endDate?: string };
        const report = await reportService.getVisitReport(
          req.workspaceId!,
          query.startDate,
          query.endDate,
        );
        return reply.status(200).send(report);
      } catch (err: any) {
        req.log.error(err, 'Failed to generate visit report');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to generate visit report',
        });
      }
    },
  );

  // GET /v1/reports/export/csv - Stream attendance report as CSV
  app.get(
    '/v1/reports/export/csv',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.ATTENDANCE_TEAM_READ),
      ],
    },
    async (req, reply) => {
      try {
        const query = req.query as { startDate?: string; endDate?: string };
        const csv = await reportService.generateAttendanceCsv(
          req.workspaceId!,
          query.startDate,
          query.endDate,
        );

        reply.header('Content-Type', 'text/csv');
        reply.header(
          'Content-Disposition',
          `attachment; filename="oprino_attendance_${Date.now()}.csv"`,
        );
        return reply.status(200).send(csv);
      } catch (err: any) {
        req.log.error(err, 'Failed to export CSV report');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to export CSV',
        });
      }
    },
  );

  // POST /v1/customers/:customerId/sites/import-csv - Bulk import customer sites
  app.post(
    '/v1/customers/:customerId/sites/import-csv',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.CUSTOMERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const { customerId } = req.params as { customerId: string };
      const { csvContent } = (req.body as { csvContent?: string }) || {};

      if (!csvContent) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing csvContent in request body',
        });
      }

      try {
        const result = await reportService.bulkImportSites(
          req.workspaceId!,
          customerId,
          csvContent,
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to bulk import sites');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: err.message || 'Failed to import sites',
        });
      }
    },
  );
};
