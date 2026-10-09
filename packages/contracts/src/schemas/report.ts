import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const AttendanceSummaryItemSchema = z
  .object({
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().openapi({ example: 'Jane Field Tech' }),
    userEmail: z.string().email().openapi({ example: 'jane@example.com' }),
    presentDays: z.number().int().openapi({ example: 22 }),
    totalMinutes: z.number().int().openapi({ example: 10560 }),
    totalHours: z.number().openapi({ example: 176.0 }),
    lateDays: z.number().int().openapi({ example: 1 }),
    totalLateMinutes: z.number().int().openapi({ example: 15 }),
  })
  .openapi('AttendanceSummaryItem');

export const AttendanceReportResponseSchema = z
  .object({
    startDate: z.string().openapi({ example: '2026-10-01' }),
    endDate: z.string().openapi({ example: '2026-10-31' }),
    totalEmployees: z.number().int().openapi({ example: 12 }),
    totalCompanyHours: z.number().openapi({ example: 2112.0 }),
    items: z.array(AttendanceSummaryItemSchema),
  })
  .openapi('AttendanceReportResponse');

export const TaskSlaReportResponseSchema = z
  .object({
    totalTasks: z.number().int().openapi({ example: 150 }),
    completedTasks: z.number().int().openapi({ example: 142 }),
    verifiedTasks: z.number().int().openapi({ example: 138 }),
    rejectedTasks: z.number().int().openapi({ example: 4 }),
    overdueTasks: z.number().int().openapi({ example: 8 }),
    onTimeRate: z.number().openapi({ example: 94.6 }),
    statusDistribution: z.record(z.number().int()).openapi({
      example: { ASSIGNED: 3, IN_PROGRESS: 5, COMPLETED: 4, VERIFIED: 138 },
    }),
  })
  .openapi('TaskSlaReportResponse');

export const VisitReportResponseSchema = z
  .object({
    totalVisits: z.number().int().openapi({ example: 85 }),
    completedVisits: z.number().int().openapi({ example: 80 }),
    plannedVisits: z.number().int().openapi({ example: 5 }),
    totalDurationMinutes: z.number().int().openapi({ example: 4250 }),
    averageDurationMinutes: z.number().openapi({ example: 53.1 }),
  })
  .openapi('VisitReportResponse');

export const BulkImportResultSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    importedCount: z.number().int().openapi({ example: 25 }),
    failedCount: z.number().int().openapi({ example: 0 }),
    errors: z.array(z.string()).default([]),
  })
  .openapi('BulkImportResult');

export type AttendanceSummaryItem = z.infer<typeof AttendanceSummaryItemSchema>;
export type AttendanceReportResponse = z.infer<typeof AttendanceReportResponseSchema>;
export type TaskSlaReportResponse = z.infer<typeof TaskSlaReportResponseSchema>;
export type VisitReportResponse = z.infer<typeof VisitReportResponseSchema>;
export type BulkImportResult = z.infer<typeof BulkImportResultSchema>;
