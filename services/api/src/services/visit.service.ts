import { eq, and, desc, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { visits, customers, customerSites, tasks, users } from '@oprino/database/schema';
import type {
  CreateVisitRequest,
  VisitCheckInRequest,
  VisitCheckOutRequest,
} from '@oprino/contracts';

export class VisitService {
  constructor(private db: Database) {}

  /**
   * Schedules or creates a site visit.
   */
  async createVisit(
    workspaceId: string,
    input: CreateVisitRequest,
    fallbackUserId: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const targetUserId = input.userId ?? fallbackUserId;

      const [visit] = await tx
        .insert(visits)
        .values({
          workspaceId,
          customerId: input.customerId,
          siteId: input.siteId ?? null,
          taskId: input.taskId ?? null,
          userId: targetUserId,
          status: 'PLANNED',
          plannedAt: input.plannedAt ? new Date(input.plannedAt) : null,
          notes: input.notes ?? null,
        })
        .returning();

      if (!visit) {
        throw new Error('Failed to create visit');
      }

      return this.getVisitByIdInternal(tx, workspaceId, visit.id);
    });
  }

  /**
   * Lists visits with multi-criteria filtering and role constraints.
   */
  async listVisits(
    workspaceId: string,
    query?: { status?: string; userId?: string; customerId?: string; date?: string },
    restrictToUserId?: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const conditions = [eq(visits.workspaceId, workspaceId)];

      if (query?.status) {
        conditions.push(eq(visits.status, query.status as any));
      }

      const effectiveUserId = restrictToUserId || query?.userId;
      if (effectiveUserId) {
        conditions.push(eq(visits.userId, effectiveUserId));
      }

      if (query?.customerId) {
        conditions.push(eq(visits.customerId, query.customerId));
      }

      if (query?.date) {
        // Match visits where plannedAt or createdAt matches UTC date YYYY-MM-DD
        conditions.push(
          sql`DATE(${visits.plannedAt} AT TIME ZONE 'UTC') = ${query.date}::date OR (DATE(${visits.createdAt} AT TIME ZONE 'UTC') = ${query.date}::date AND ${visits.plannedAt} IS NULL)`,
        );
      }

      const rows = await tx
        .select({
          visit: visits,
          customerName: customers.name,
          siteName: customerSites.name,
          taskTitle: tasks.title,
          userName: users.name,
        })
        .from(visits)
        .innerJoin(customers, eq(visits.customerId, customers.id))
        .leftJoin(customerSites, eq(visits.siteId, customerSites.id))
        .leftJoin(tasks, eq(visits.taskId, tasks.id))
        .innerJoin(users, eq(visits.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(visits.createdAt));

      return {
        visits: rows.map((r) => ({
          id: r.visit.id,
          workspaceId: r.visit.workspaceId,
          customerId: r.visit.customerId,
          customerName: r.customerName,
          siteId: r.visit.siteId,
          siteName: r.siteName,
          taskId: r.visit.taskId,
          taskTitle: r.taskTitle,
          userId: r.visit.userId,
          userName: r.userName,
          status: r.visit.status,
          plannedAt: r.visit.plannedAt ? r.visit.plannedAt.toISOString() : null,
          checkInTime: r.visit.checkInTime ? r.visit.checkInTime.toISOString() : null,
          checkOutTime: r.visit.checkOutTime ? r.visit.checkOutTime.toISOString() : null,
          checkInLatitude: r.visit.checkInLatitude,
          checkInLongitude: r.visit.checkInLongitude,
          checkOutLatitude: r.visit.checkOutLatitude,
          checkOutLongitude: r.visit.checkOutLongitude,
          durationMinutes: r.visit.durationMinutes,
          notes: r.visit.notes,
          createdAt: r.visit.createdAt.toISOString(),
          updatedAt: r.visit.updatedAt.toISOString(),
        })),
        total: rows.length,
      };
    });
  }

  /**
   * Retrieves single visit by ID.
   */
  async getVisitById(workspaceId: string, visitId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);
      return this.getVisitByIdInternal(tx, workspaceId, visitId);
    });
  }

  /**
   * Executes GPS-geotagged check-in for a site visit.
   */
  async checkInVisit(
    workspaceId: string,
    visitId: string,
    _actorId: string,
    input: VisitCheckInRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [existing] = await tx
        .select()
        .from(visits)
        .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, visitId)));

      if (!existing) {
        const error = new Error('Visit not found');
        (error as any).statusCode = 404;
        throw error;
      }

      if (existing.status !== 'PLANNED') {
        const error = new Error(`Cannot check in visit with status ${existing.status}`);
        (error as any).statusCode = 400;
        throw error;
      }

      const combinedNotes = input.notes
        ? existing.notes
          ? `${existing.notes}\n[Check-in]: ${input.notes}`
          : input.notes
        : existing.notes;

      await tx
        .update(visits)
        .set({
          status: 'CHECKED_IN',
          checkInTime: new Date(),
          checkInLatitude: input.latitude,
          checkInLongitude: input.longitude,
          notes: combinedNotes,
          updatedAt: new Date(),
        })
        .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, visitId)));

      return this.getVisitByIdInternal(tx, workspaceId, visitId);
    });
  }

  /**
   * Executes GPS-geotagged check-out for a site visit and computes elapsed duration.
   */
  async checkOutVisit(
    workspaceId: string,
    visitId: string,
    _actorId: string,
    input: VisitCheckOutRequest,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [existing] = await tx
        .select()
        .from(visits)
        .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, visitId)));

      if (!existing) {
        const error = new Error('Visit not found');
        (error as any).statusCode = 404;
        throw error;
      }

      if (existing.status !== 'CHECKED_IN') {
        const error = new Error(`Cannot check out visit with status ${existing.status}`);
        (error as any).statusCode = 400;
        throw error;
      }

      const checkOutTime = new Date();
      let durationMinutes = 0;
      if (existing.checkInTime) {
        durationMinutes = Math.max(
          1,
          Math.round((checkOutTime.getTime() - existing.checkInTime.getTime()) / 60000),
        );
      }

      const combinedNotes = input.notes
        ? existing.notes
          ? `${existing.notes}\n[Check-out]: ${input.notes}`
          : input.notes
        : existing.notes;

      await tx
        .update(visits)
        .set({
          status: 'CHECKED_OUT',
          checkOutTime,
          checkOutLatitude: input.latitude,
          checkOutLongitude: input.longitude,
          durationMinutes,
          notes: combinedNotes,
          updatedAt: new Date(),
        })
        .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, visitId)));

      return this.getVisitByIdInternal(tx, workspaceId, visitId);
    });
  }

  private async getVisitByIdInternal(tx: any, workspaceId: string, visitId: string) {
    const [row] = await tx
      .select({
        visit: visits,
        customerName: customers.name,
        siteName: customerSites.name,
        taskTitle: tasks.title,
        userName: users.name,
      })
      .from(visits)
      .innerJoin(customers, eq(visits.customerId, customers.id))
      .leftJoin(customerSites, eq(visits.siteId, customerSites.id))
      .leftJoin(tasks, eq(visits.taskId, tasks.id))
      .innerJoin(users, eq(visits.userId, users.id))
      .where(and(eq(visits.workspaceId, workspaceId), eq(visits.id, visitId)));

    if (!row) {
      const error = new Error('Visit not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return {
      id: row.visit.id,
      workspaceId: row.visit.workspaceId,
      customerId: row.visit.customerId,
      customerName: row.customerName,
      siteId: row.visit.siteId,
      siteName: row.siteName,
      taskId: row.visit.taskId,
      taskTitle: row.taskTitle,
      userId: row.visit.userId,
      userName: row.userName,
      status: row.visit.status,
      plannedAt: row.visit.plannedAt ? row.visit.plannedAt.toISOString() : null,
      checkInTime: row.visit.checkInTime ? row.visit.checkInTime.toISOString() : null,
      checkOutTime: row.visit.checkOutTime ? row.visit.checkOutTime.toISOString() : null,
      checkInLatitude: row.visit.checkInLatitude,
      checkInLongitude: row.visit.checkInLongitude,
      checkOutLatitude: row.visit.checkOutLatitude,
      checkOutLongitude: row.visit.checkOutLongitude,
      durationMinutes: row.visit.durationMinutes,
      notes: row.visit.notes,
      createdAt: row.visit.createdAt.toISOString(),
      updatedAt: row.visit.updatedAt.toISOString(),
    };
  }
}
