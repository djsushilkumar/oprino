import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const DutyStateEnum = z.enum(['NOT_STARTED', 'ON_DUTY', 'OFF_DUTY']);
export type DutyState = z.infer<typeof DutyStateEnum>;

export const AttendanceShiftSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'General Day Shift' }),
    startTime: z.string().openapi({ example: '09:00' }),
    endTime: z.string().openapi({ example: '17:00' }),
    timezone: z.string().openapi({ example: 'UTC' }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: '2026-10-05T08:00:00.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-05T08:00:00.000Z' }),
  })
  .openapi('AttendanceShift');

export const CreateShiftRequestSchema = z
  .object({
    name: z.string().min(1).max(100).openapi({ example: 'Night Shift' }),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM')
      .openapi({ example: '22:00' }),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM')
      .openapi({ example: '06:00' }),
    timezone: z.string().optional().default('UTC').openapi({ example: 'UTC' }),
  })
  .openapi('CreateShiftRequest');

export const ListShiftsResponseSchema = z
  .object({
    shifts: z.array(AttendanceShiftSchema),
  })
  .openapi('ListShiftsResponse');

export const AttendanceSessionResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'ses1b2c3-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().optional().openapi({ example: 'Jane Field Tech' }),
    userEmail: z.string().optional().openapi({ example: 'jane@example.com' }),
    shiftId: z.string().uuid().nullable().optional().openapi({ example: null }),
    shiftName: z.string().nullable().optional().openapi({ example: 'General Day Shift' }),
    status: z.enum(['ON_DUTY', 'OFF_DUTY']).openapi({ example: 'ON_DUTY' }),
    punchInTime: z.string().openapi({ example: '2026-10-05T09:02:15.000Z' }),
    punchOutTime: z.string().nullable().optional().openapi({ example: null }),
    durationMinutes: z.number().int().nullable().optional().openapi({ example: 480 }),
    selfieMediaKey: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'w1/attendance/u1/selfie.jpg' }),
    punchInLatitude: z.number().nullable().optional().openapi({ example: 28.6139 }),
    punchInLongitude: z.number().nullable().optional().openapi({ example: 77.209 }),
    punchInAccuracy: z.number().nullable().optional().openapi({ example: 10.5 }),
    isLate: z.boolean().openapi({ example: false }),
    lateMinutes: z.number().int().openapi({ example: 0 }),
    isManualAdjustment: z.boolean().openapi({ example: false }),
    adjustmentNote: z.string().nullable().optional().openapi({ example: null }),
    createdAt: z.string().openapi({ example: '2026-10-05T09:02:15.000Z' }),
    updatedAt: z.string().openapi({ example: '2026-10-05T09:02:15.000Z' }),
  })
  .openapi('AttendanceSessionResponse');

export const PunchInRequestSchema = z
  .object({
    idempotencyKey: z.string().min(1).max(255).openapi({ example: 'mut-punch-in-uuid-123' }),
    shiftId: z
      .string()
      .uuid()
      .optional()
      .openapi({ example: 's1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    note: z.string().optional().openapi({ example: 'Starting shift on site A' }),
    selfieMediaKey: z.string().optional().openapi({ example: 'w1/attendance/u1/selfie.jpg' }),
    latitude: z.number().optional().openapi({ example: 28.6139 }),
    longitude: z.number().optional().openapi({ example: 77.209 }),
    accuracy: z.number().optional().openapi({ example: 10.5 }),
  })
  .openapi('PunchInRequest');

export const PunchOutRequestSchema = z
  .object({
    idempotencyKey: z.string().min(1).max(255).openapi({ example: 'mut-punch-out-uuid-456' }),
    note: z.string().optional().openapi({ example: 'Finished day work' }),
  })
  .openapi('PunchOutRequest');

export const CurrentAttendanceResponseSchema = z
  .object({
    dutyState: DutyStateEnum.openapi({ example: 'ON_DUTY' }),
    activeSession: AttendanceSessionResponseSchema.nullable().optional(),
    lastSession: AttendanceSessionResponseSchema.nullable().optional(),
    assignedShift: AttendanceShiftSchema.nullable().optional(),
    serverTime: z.string().openapi({ example: '2026-10-05T09:30:00.000Z' }),
  })
  .openapi('CurrentAttendanceResponse');

export const AttendanceHistoryResponseSchema = z
  .object({
    sessions: z.array(AttendanceSessionResponseSchema),
    total: z.number().int().openapi({ example: 10 }),
  })
  .openapi('AttendanceHistoryResponse');

export const TeamAttendanceResponseSchema = z
  .object({
    onDutyCount: z.number().int().openapi({ example: 5 }),
    offDutyCount: z.number().int().openapi({ example: 3 }),
    activeSessions: z.array(AttendanceSessionResponseSchema),
    history: z.array(AttendanceSessionResponseSchema),
  })
  .openapi('TeamAttendanceResponse');

export const ShiftRosterStatusEnum = z.enum(['SCHEDULED', 'ATTENDED', 'MISSED', 'EXCUSED']);
export type ShiftRosterStatus = z.infer<typeof ShiftRosterStatusEnum>;

export const ShiftRosterSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'sr1b2c3d-e5f6-7890-abcd-ef1234567890' }),
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    shiftId: z.string().uuid().openapi({ example: 'sh1b2c3d-e5f6-7890-abcd-ef1234567890' }),
    shiftName: z.string().optional(),
    userId: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    userName: z.string().optional(),
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .openapi({ example: '2026-10-09' }),
    status: ShiftRosterStatusEnum.openapi({ example: 'SCHEDULED' }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('ShiftRoster');

export const AssignShiftRosterRequestSchema = z
  .object({
    shiftId: z.string().uuid(),
    userIds: z.array(z.string().uuid()),
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  })
  .openapi('AssignShiftRosterRequest');

export const ListShiftRostersResponseSchema = z
  .object({
    rosters: z.array(ShiftRosterSchema),
    total: z.number().int(),
  })
  .openapi('ListShiftRostersResponse');

export type AttendanceShift = z.infer<typeof AttendanceShiftSchema>;
export type CreateShiftRequest = z.infer<typeof CreateShiftRequestSchema>;
export type ListShiftsResponse = z.infer<typeof ListShiftsResponseSchema>;
export type AttendanceSessionResponse = z.infer<typeof AttendanceSessionResponseSchema>;
export type PunchInRequest = z.infer<typeof PunchInRequestSchema>;
export type PunchOutRequest = z.infer<typeof PunchOutRequestSchema>;
export type CurrentAttendanceResponse = z.infer<typeof CurrentAttendanceResponseSchema>;
export type AttendanceHistoryResponse = z.infer<typeof AttendanceHistoryResponseSchema>;
export type TeamAttendanceResponse = z.infer<typeof TeamAttendanceResponseSchema>;
export type ShiftRoster = z.infer<typeof ShiftRosterSchema>;
export type AssignShiftRosterRequest = z.infer<typeof AssignShiftRosterRequestSchema>;
export type ListShiftRostersResponse = z.infer<typeof ListShiftRostersResponseSchema>;
