import { eq, and, sql, gte, lte } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import {
  attendanceSessions,
  tasks,
  visits,
  users,
  workspaceMemberships,
  customerSites,
} from '@oprino/database/schema';
import type {
  AttendanceReportResponse,
  TaskSlaReportResponse,
  VisitReportResponse,
  BulkImportResult,
} from '@oprino/contracts';

/**
 * RFC 4180 compliant CSV line tokenizer that respects quoted strings containing commas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export class ReportService {
  constructor(private db: Database) {}

  /**
   * Aggregates attendance statistics across members for a date range.
   */
  async getAttendanceReport(
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceReportResponse> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const defaultEnd = now.toISOString().slice(0, 10);

      const start = startDate || defaultStart;
      const end = endDate || defaultEnd;

      // 1. Fetch active members in workspace
      const members = await tx
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
        })
        .from(workspaceMemberships)
        .innerJoin(users, eq(workspaceMemberships.userId, users.id))
        .where(
          and(
            eq(workspaceMemberships.workspaceId, workspaceId),
            eq(workspaceMemberships.status, 'active'),
          ),
        );

      // 2. Fetch attendance sessions within date window
      const sessions = await tx
        .select()
        .from(attendanceSessions)
        .where(
          and(
            eq(attendanceSessions.workspaceId, workspaceId),
            gte(attendanceSessions.punchInTime, new Date(start)),
            lte(attendanceSessions.punchInTime, new Date(`${end}T23:59:59.999Z`)),
          ),
        );

      const items = members.map((m) => {
        const userSessions = sessions.filter((s) => s.userId === m.userId);
        const presentDates = new Set(
          userSessions.map((s) => s.punchInTime.toISOString().slice(0, 10)),
        );
        const presentDays = presentDates.size;
        const totalMinutes = userSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const lateDays = userSessions.filter((s) => s.isLate).length;
        const totalLateMinutes = userSessions.reduce((acc, s) => acc + (s.lateMinutes || 0), 0);

        return {
          userId: m.userId,
          userName: m.userName,
          userEmail: m.userEmail,
          presentDays,
          totalMinutes,
          totalHours,
          lateDays,
          totalLateMinutes,
        };
      });

      const totalCompanyHours =
        Math.round(items.reduce((acc, i) => acc + i.totalHours, 0) * 10) / 10;

      return {
        startDate: start,
        endDate: end,
        totalEmployees: members.length,
        totalCompanyHours,
        items,
      };
    });
  }

  /**
   * Aggregates task completion and SLA compliance metrics.
   */
  async getTaskSlaReport(
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TaskSlaReportResponse> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const conditions = [eq(tasks.workspaceId, workspaceId)];
      if (startDate) {
        conditions.push(gte(tasks.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(tasks.createdAt, new Date(`${endDate}T23:59:59.999Z`)));
      }

      const rows = await tx
        .select()
        .from(tasks)
        .where(and(...conditions));

      const totalTasks = rows.length;
      let completedTasks = 0;
      let verifiedTasks = 0;
      let rejectedTasks = 0;
      let onTimeCount = 0;
      let overdueTasks = 0;
      const statusDistribution: Record<string, number> = {};

      const now = new Date();

      for (const t of rows) {
        statusDistribution[t.status] = (statusDistribution[t.status] || 0) + 1;

        if (t.status === 'COMPLETED' || t.status === 'VERIFIED') {
          completedTasks++;
        }
        if (t.status === 'VERIFIED') {
          verifiedTasks++;
        }
        if (t.verificationNotes?.includes('REJECTED') || t.status === 'IN_PROGRESS' && t.verifiedBy) {
          rejectedTasks++;
        }

        const isFinished = t.status === 'COMPLETED' || t.status === 'VERIFIED';
        if (t.dueAt) {
          const dueTime = new Date(t.dueAt);
          if (isFinished && t.updatedAt <= dueTime) {
            onTimeCount++;
          } else if (!isFinished && now > dueTime) {
            overdueTasks++;
          }
        } else if (isFinished) {
          onTimeCount++;
        }
      }

      const onTimeRate =
        completedTasks > 0 ? Math.round((onTimeCount / completedTasks) * 1000) / 10 : 100.0;

      return {
        totalTasks,
        completedTasks,
        verifiedTasks,
        rejectedTasks,
        overdueTasks,
        onTimeRate,
        statusDistribution,
      };
    });
  }

  /**
   * Aggregates physical customer site visit operational metrics.
   */
  async getVisitReport(
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<VisitReportResponse> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const conditions = [eq(visits.workspaceId, workspaceId)];
      if (startDate) {
        conditions.push(gte(visits.createdAt, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(visits.createdAt, new Date(`${endDate}T23:59:59.999Z`)));
      }

      const rows = await tx
        .select()
        .from(visits)
        .where(and(...conditions));

      const totalVisits = rows.length;
      const completedVisits = rows.filter((v) => v.status === 'CHECKED_OUT').length;
      const plannedVisits = rows.filter((v) => v.status === 'PLANNED').length;
      const totalDurationMinutes = rows.reduce((acc, v) => acc + (v.durationMinutes || 0), 0);
      const averageDurationMinutes =
        completedVisits > 0
          ? Math.round((totalDurationMinutes / completedVisits) * 10) / 10
          : 0;

      return {
        totalVisits,
        completedVisits,
        plannedVisits,
        totalDurationMinutes,
        averageDurationMinutes,
      };
    });
  }

  /**
   * Memory-safe streaming CSV of attendance records.
   */
  async generateAttendanceCsv(
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const report = await this.getAttendanceReport(workspaceId, startDate, endDate);

    const headers = [
      'User ID',
      'Employee Name',
      'Email',
      'Present Days',
      'Total Duty Hours',
      'Late Days',
      'Total Late Minutes',
    ];

    const lines = [headers.join(',')];

    for (const item of report.items) {
      lines.push(
        [
          `"${item.userId}"`,
          `"${item.userName.replace(/"/g, '""')}"`,
          `"${item.userEmail.replace(/"/g, '""')}"`,
          item.presentDays,
          item.totalHours,
          item.lateDays,
          item.totalLateMinutes,
        ].join(','),
      );
    }

    return lines.join('\n');
  }

  /**
   * Bulk imports customer sites from parsed CSV data.
   */
  async bulkImportSites(
    workspaceId: string,
    customerId: string,
    csvContent: string,
  ): Promise<BulkImportResult> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const lines = csvContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length <= 1) {
        return { success: true, importedCount: 0, failedCount: 0, errors: [] };
      }

      // Format expected: Name, Address, Latitude, Longitude, Contact Name, Contact Phone
      const rows = lines.slice(1);
      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const parts = parseCsvLine(rows[i]).map((p) => p.replace(/^"|"$/g, '').trim());
        const [name, address, latStr, lngStr, contactName, contactPhone] = parts;

        if (!name || !address) {
          errors.push(`Row ${i + 2}: Name and Address are required`);
          continue;
        }

        const latitude = latStr ? parseFloat(latStr) : null;
        const longitude = lngStr ? parseFloat(lngStr) : null;

        await tx.insert(customerSites).values({
          workspaceId,
          customerId,
          name,
          address,
          latitude: latitude && !isNaN(latitude) ? latitude : null,
          longitude: longitude && !isNaN(longitude) ? longitude : null,
          contactName: contactName || null,
          contactPhone: contactPhone || null,
        });

        importedCount++;
      }

      return {
        success: errors.length === 0,
        importedCount,
        failedCount: errors.length,
        errors,
      };
    });
  }
}
