import { eq, and, sql, gte, lte } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import {
  recurringTaskTemplates,
  shiftRosters,
  attendanceShifts,
  users,
  tasks,
  taskAssignees,
  taskChecklistItems,
  taskActivity,
} from '@oprino/database/schema';
import type {
  CreateRecurringTaskTemplateRequest,
  UpdateRecurringTaskTemplateRequest,
  AssignShiftRosterRequest,
} from '@oprino/contracts';

export class SchedulingService {
  constructor(private db: Database) {}

  /**
   * Calculates next execution timestamp for a recurrence pattern.
   */
  calculateNextRun(
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: number,
    timeOfDay: string,
    _timezone: string,
    daysOfWeek: number[] = [],
    dayOfMonth?: number,
    from: Date = new Date(),
  ): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const candidate = new Date(from);
    candidate.setHours(hours, minutes, 0, 0);

    // If candidate time is earlier than or equal to current time, move forward
    if (candidate.getTime() <= from.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }

    if (frequency === 'DAILY') {
      if (interval > 1) {
        candidate.setDate(candidate.getDate() + (interval - 1));
      }
      return candidate;
    }

    if (frequency === 'WEEKLY') {
      const allowedDays = daysOfWeek.length > 0 ? daysOfWeek : [1, 2, 3, 4, 5]; // Default to Mon-Fri
      while (!allowedDays.includes(candidate.getDay())) {
        candidate.setDate(candidate.getDate() + 1);
      }
      return candidate;
    }

    if (frequency === 'MONTHLY') {
      const targetDay = dayOfMonth ?? 1;
      candidate.setDate(targetDay);
      if (candidate.getTime() <= from.getTime()) {
        candidate.setMonth(candidate.getMonth() + interval);
      }
      return candidate;
    }

    return candidate;
  }

  /**
   * Creates a tenant-scoped recurring task template.
   */
  async createRecurringTemplate(
    workspaceId: string,
    creatorId: string,
    input: CreateRecurringTaskTemplateRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const nextRunAt = this.calculateNextRun(
        input.recurrenceFrequency,
        input.recurrenceInterval ?? 1,
        input.timeOfDay ?? '09:00',
        input.timezone ?? 'UTC',
        input.daysOfWeek ?? [],
        input.dayOfMonth,
      );

      const [template] = await tx
        .insert(recurringTaskTemplates)
        .values({
          workspaceId,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? 'MEDIUM',
          customerId: input.customerId ?? null,
          siteId: input.siteId ?? null,
          requiresSignature: input.requiresSignature ?? false,
          requiresPhotoProof: input.requiresPhotoProof ?? false,
          checklistTemplate: input.checklistTemplate ?? [],
          assigneeIds: input.assigneeIds ?? [],
          recurrenceFrequency: input.recurrenceFrequency,
          recurrenceInterval: input.recurrenceInterval ?? 1,
          daysOfWeek: input.daysOfWeek ?? [],
          dayOfMonth: input.dayOfMonth ?? null,
          timeOfDay: input.timeOfDay ?? '09:00',
          timezone: input.timezone ?? 'UTC',
          isActive: true,
          nextRunAt,
          createdBy: creatorId,
        })
        .returning();

      return this.mapTemplate(template);
    });
  }

  /**
   * Lists recurring templates for a workspace.
   */
  async listRecurringTemplates(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select()
        .from(recurringTaskTemplates)
        .where(eq(recurringTaskTemplates.workspaceId, workspaceId))
        .orderBy(sql`${recurringTaskTemplates.createdAt} DESC`);

      return {
        templates: rows.map(this.mapTemplate),
        total: rows.length,
      };
    });
  }

  /**
   * Updates an existing recurring template.
   */
  async updateRecurringTemplate(
    workspaceId: string,
    templateId: string,
    input: UpdateRecurringTaskTemplateRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [existing] = await tx
        .select()
        .from(recurringTaskTemplates)
        .where(
          and(
            eq(recurringTaskTemplates.workspaceId, workspaceId),
            eq(recurringTaskTemplates.id, templateId),
          ),
        );

      if (!existing) {
        const error = new Error('Recurring template not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const frequency = input.recurrenceFrequency ?? existing.recurrenceFrequency;
      const interval = input.recurrenceInterval ?? existing.recurrenceInterval;
      const timeOfDay = input.timeOfDay ?? existing.timeOfDay;
      const timezone = input.timezone ?? existing.timezone;
      const daysOfWeek = (input.daysOfWeek ?? existing.daysOfWeek) as number[];
      const dayOfMonth = input.dayOfMonth ?? existing.dayOfMonth;

      const nextRunAt = this.calculateNextRun(
        frequency as any,
        interval,
        timeOfDay,
        timezone,
        daysOfWeek,
        dayOfMonth ?? undefined,
      );

      const [updated] = await tx
        .update(recurringTaskTemplates)
        .set({
          title: input.title ?? existing.title,
          description: input.description !== undefined ? input.description : existing.description,
          priority: input.priority ?? existing.priority,
          customerId: input.customerId !== undefined ? input.customerId : existing.customerId,
          siteId: input.siteId !== undefined ? input.siteId : existing.siteId,
          requiresSignature:
            input.requiresSignature !== undefined
              ? input.requiresSignature
              : existing.requiresSignature,
          requiresPhotoProof:
            input.requiresPhotoProof !== undefined
              ? input.requiresPhotoProof
              : existing.requiresPhotoProof,
          checklistTemplate: input.checklistTemplate ?? existing.checklistTemplate,
          assigneeIds: input.assigneeIds ?? existing.assigneeIds,
          recurrenceFrequency: frequency,
          recurrenceInterval: interval,
          daysOfWeek,
          dayOfMonth,
          timeOfDay,
          timezone,
          isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
          nextRunAt,
          updatedAt: new Date(),
        })
        .where(eq(recurringTaskTemplates.id, templateId))
        .returning();

      return this.mapTemplate(updated);
    });
  }

  /**
   * Spawns concrete tasks for all templates where nextRunAt <= NOW().
   */
  async generateDueRecurringTasks(targetWorkspaceId?: string): Promise<number> {
    const now = new Date();
    let generatedCount = 0;

    const templates = await this.db.transaction(async (tx) => {
      if (targetWorkspaceId) {
        await tx.execute(
          sql`SELECT set_config('app.current_workspace_id', ${targetWorkspaceId}, true)`,
        );
      } else {
        await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);
      }

      return tx
        .select()
        .from(recurringTaskTemplates)
        .where(
          and(
            eq(recurringTaskTemplates.isActive, true),
            lte(recurringTaskTemplates.nextRunAt, now),
          ),
        );
    });

    for (const template of templates) {
      await this.db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT set_config('app.current_workspace_id', ${template.workspaceId}, true)`,
        );

        // 1. Insert new Task
        const [task] = await tx
          .insert(tasks)
          .values({
            workspaceId: template.workspaceId,
            title: template.title,
            description: template.description,
            status: 'ASSIGNED',
            priority: template.priority,
            customerId: template.customerId,
            siteId: template.siteId,
            requiresSignature: template.requiresSignature,
            requiresPhotoProof: template.requiresPhotoProof,
            createdBy: template.createdBy,
          })
          .returning();

        // 2. Assignees
        const assigneeIds = (template.assigneeIds as string[]) || [];
        for (const userId of assigneeIds) {
          await tx.insert(taskAssignees).values({
            workspaceId: template.workspaceId,
            taskId: task.id,
            userId,
            assignedBy: template.createdBy,
          });
        }

        // 3. Checklist Items
        const checklist = (template.checklistTemplate as Array<{ title: string; sortOrder?: number }>) || [];
        for (let i = 0; i < checklist.length; i++) {
          await tx.insert(taskChecklistItems).values({
            workspaceId: template.workspaceId,
            taskId: task.id,
            title: checklist[i].title,
            sortOrder: checklist[i].sortOrder ?? i,
          });
        }

        // 4. Activity entry
        await tx.insert(taskActivity).values({
          workspaceId: template.workspaceId,
          taskId: task.id,
          actorId: template.createdBy,
          action: 'task.recurring_generated',
          details: { templateId: template.id, generatedAt: now.toISOString() },
        });

        // 5. Advance template nextRunAt
        const nextRunAt = this.calculateNextRun(
          template.recurrenceFrequency as any,
          template.recurrenceInterval,
          template.timeOfDay,
          template.timezone,
          (template.daysOfWeek as number[]) || [],
          template.dayOfMonth ?? undefined,
          now,
        );

        await tx
          .update(recurringTaskTemplates)
          .set({
            lastRunAt: now,
            nextRunAt,
            updatedAt: now,
          })
          .where(eq(recurringTaskTemplates.id, template.id));

        generatedCount++;
      });
    }

    return generatedCount;
  }

  /**
   * Assigns shift rosters for employees across specific dates.
   */
  async assignShiftRosters(
    workspaceId: string,
    input: AssignShiftRosterRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const createdRosters = [];

      for (const scheduledDate of input.dates) {
        for (const userId of input.userIds) {
          const [roster] = await tx
            .insert(shiftRosters)
            .values({
              workspaceId,
              shiftId: input.shiftId,
              userId,
              scheduledDate,
              status: 'SCHEDULED',
            })
            .onConflictDoUpdate({
              target: [shiftRosters.workspaceId, shiftRosters.userId, shiftRosters.scheduledDate],
              set: {
                shiftId: input.shiftId,
                status: 'SCHEDULED',
                updatedAt: new Date(),
              },
            })
            .returning();

          createdRosters.push(roster);
        }
      }

      return this.listShiftRosters(workspaceId, {
        startDate: input.dates[0],
        endDate: input.dates[input.dates.length - 1],
      });
    });
  }

  /**
   * Lists shift rosters with date range filtering.
   */
  async listShiftRosters(
    workspaceId: string,
    filters?: { startDate?: string; endDate?: string; userId?: string },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const conditions = [eq(shiftRosters.workspaceId, workspaceId)];

      if (filters?.startDate) {
        conditions.push(gte(shiftRosters.scheduledDate, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(shiftRosters.scheduledDate, filters.endDate));
      }
      if (filters?.userId) {
        conditions.push(eq(shiftRosters.userId, filters.userId));
      }

      const rows = await tx
        .select({
          roster: shiftRosters,
          shiftName: attendanceShifts.name,
          userName: users.name,
        })
        .from(shiftRosters)
        .innerJoin(attendanceShifts, eq(shiftRosters.shiftId, attendanceShifts.id))
        .innerJoin(users, eq(shiftRosters.userId, users.id))
        .where(and(...conditions))
        .orderBy(sql`${shiftRosters.scheduledDate} ASC`);

      return {
        rosters: rows.map((r: any) => ({
          id: r.roster.id,
          workspaceId: r.roster.workspaceId,
          shiftId: r.roster.shiftId,
          shiftName: r.shiftName,
          userId: r.roster.userId,
          userName: r.userName,
          scheduledDate: r.roster.scheduledDate,
          status: r.roster.status,
          createdAt: r.roster.createdAt.toISOString(),
          updatedAt: r.roster.updatedAt.toISOString(),
        })),
        total: rows.length,
      };
    });
  }

  private mapTemplate(row: any) {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      title: row.title,
      description: row.description,
      priority: row.priority,
      customerId: row.customerId,
      siteId: row.siteId,
      requiresSignature: row.requiresSignature,
      requiresPhotoProof: row.requiresPhotoProof,
      checklistTemplate: row.checklistTemplate || [],
      assigneeIds: row.assigneeIds || [],
      recurrenceFrequency: row.recurrenceFrequency,
      recurrenceInterval: row.recurrenceInterval,
      daysOfWeek: row.daysOfWeek || [],
      dayOfMonth: row.dayOfMonth,
      timeOfDay: row.timeOfDay,
      timezone: row.timezone,
      isActive: row.isActive,
      nextRunAt: row.nextRunAt.toISOString(),
      lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
