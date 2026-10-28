import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import {
  tasks,
  taskAssignees,
  taskChecklistItems,
  taskComments,
  taskActivity,
  taskProofs,
  customers,
  customerSites,
  workspaceMemberships,
  users,
} from '@oprino/database/schema';

export const VALID_TASK_TRANSITIONS: Record<string, string[]> = {
  ASSIGNED: ['ACCEPTED'],
  ACCEPTED: ['EN_ROUTE', 'IN_PROGRESS', 'ASSIGNED'],
  EN_ROUTE: ['ARRIVED', 'IN_PROGRESS'],
  ARRIVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['VERIFIED', 'IN_PROGRESS'],
  VERIFIED: [],
};

export function mapToSimplifiedStatus(status: string): 'TO_DO' | 'IN_PROGRESS' | 'DONE' {
  switch (status) {
    case 'ASSIGNED':
    case 'ACCEPTED':
      return 'TO_DO';
    case 'EN_ROUTE':
    case 'ARRIVED':
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'COMPLETED':
    case 'VERIFIED':
      return 'DONE';
    default:
      return 'TO_DO';
  }
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt?: string;
  customerId?: string;
  siteId?: string;
  requiresSignature?: boolean;
  requiresPhotoProof?: boolean;
  assigneeIds?: string[];
  checklist?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueAt?: string | null;
  customerId?: string | null;
  siteId?: string | null;
  requiresSignature?: boolean;
  requiresPhotoProof?: boolean;
  assigneeIds?: string[];
  version: number;
}

export interface TaskFilterDto {
  status?: string;
  assigneeId?: string;
  priority?: string;
  overdue?: string;
}

export class TaskService {
  constructor(private db: Database) {}

  /**
   * Validates that all candidate assignees are active members of the workspace.
   */
  private async validateAssignees(tx: any, workspaceId: string, assigneeIds: string[]) {
    if (!assigneeIds || assigneeIds.length === 0) return;

    // Check workspace membership for all assignee user IDs
    const members = await tx
      .select({
        userId: workspaceMemberships.userId,
        status: workspaceMemberships.status,
      })
      .from(workspaceMemberships)
      .where(
        and(
          eq(workspaceMemberships.workspaceId, workspaceId),
          inArray(workspaceMemberships.userId, assigneeIds),
        ),
      );

    const activeUserIds = new Set(
      members.filter((m: any) => m.status === 'active').map((m: any) => m.userId),
    );

    for (const id of assigneeIds) {
      if (!activeUserIds.has(id)) {
        const error = new Error(`Assignee ${id} is not an active member of this workspace`);
        (error as any).statusCode = 400;
        throw error;
      }
    }
  }

  /**
   * Creates a tenant-scoped task with assignees, checklists, and activity log.
   */
  async createTask(
    workspaceId: string,
    creatorId: string,
    _creatorName: string,
    input: CreateTaskDto,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 1. Validate assignees if any
      if (input.assigneeIds && input.assigneeIds.length > 0) {
        await this.validateAssignees(tx, workspaceId, input.assigneeIds);
      }

      // 2. Insert Task
      const [task] = await tx
        .insert(tasks)
        .values({
          workspaceId,
          title: input.title,
          description: input.description ?? null,
          status: 'ASSIGNED',
          priority: input.priority ?? 'MEDIUM',
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          customerId: input.customerId ?? null,
          siteId: input.siteId ?? null,
          requiresSignature: input.requiresSignature ?? false,
          requiresPhotoProof: input.requiresPhotoProof ?? false,
          createdBy: creatorId,
          version: 1,
        })
        .returning();

      if (!task) {
        throw new Error('Failed to create task');
      }

      // 3. Insert Assignees
      if (input.assigneeIds && input.assigneeIds.length > 0) {
        await tx.insert(taskAssignees).values(
          input.assigneeIds.map((userId) => ({
            workspaceId,
            taskId: task.id,
            userId,
            assignedBy: creatorId,
          })),
        );
      }

      // 4. Insert Checklist Items
      if (input.checklist && input.checklist.length > 0) {
        await tx.insert(taskChecklistItems).values(
          input.checklist.map((itemTitle, idx) => ({
            workspaceId,
            taskId: task.id,
            title: itemTitle,
            sortOrder: idx,
            isCompleted: false,
          })),
        );
      }

      // 5. Record Task Activity
      await tx.insert(taskActivity).values({
        workspaceId,
        taskId: task.id,
        actorId: creatorId,
        action: 'task.created',
        toStatus: 'ASSIGNED',
        details: {
          title: task.title,
          priority: task.priority,
          assigneeCount: input.assigneeIds?.length ?? 0,
        },
      });

      return this.getTaskByIdInternal(tx, workspaceId, task.id);
    });
  }

  /**
   * Internal helper to load full task details within transaction.
   */
  private async getTaskByIdInternal(tx: any, workspaceId: string, taskId: string) {
    const [task] = await tx
      .select({
        task: tasks,
        creatorName: users.name,
        customerName: customers.name,
        siteName: customerSites.name,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(customerSites, eq(tasks.siteId, customerSites.id))
      .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

    if (!task) {
      const error = new Error('Task not found');
      (error as any).statusCode = 404;
      throw error;
    }

    let verifierName: string | null = null;
    if (task.task.verifiedBy) {
      const [verifier] = await tx
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, task.task.verifiedBy));
      verifierName = verifier?.name ?? null;
    }

    // Load assignees
    const assigneesRows = await tx
      .select({
        id: taskAssignees.id,
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        name: users.name,
        email: users.email,
        assignedAt: taskAssignees.assignedAt,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(and(eq(taskAssignees.workspaceId, workspaceId), eq(taskAssignees.taskId, taskId)));

    // Load checklist
    const checklistRows = await tx
      .select()
      .from(taskChecklistItems)
      .where(
        and(eq(taskChecklistItems.workspaceId, workspaceId), eq(taskChecklistItems.taskId, taskId)),
      )
      .orderBy(asc(taskChecklistItems.sortOrder));

    // Load comments
    const commentsRows = await tx
      .select({
        id: taskComments.id,
        taskId: taskComments.taskId,
        authorId: taskComments.authorId,
        authorName: users.name,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.authorId, users.id))
      .where(and(eq(taskComments.workspaceId, workspaceId), eq(taskComments.taskId, taskId)))
      .orderBy(asc(taskComments.createdAt));

    // Load activity
    const activityRows = await tx
      .select({
        id: taskActivity.id,
        taskId: taskActivity.taskId,
        actorId: taskActivity.actorId,
        actorName: users.name,
        action: taskActivity.action,
        fromStatus: taskActivity.fromStatus,
        toStatus: taskActivity.toStatus,
        details: taskActivity.details,
        createdAt: taskActivity.createdAt,
      })
      .from(taskActivity)
      .innerJoin(users, eq(taskActivity.actorId, users.id))
      .where(and(eq(taskActivity.workspaceId, workspaceId), eq(taskActivity.taskId, taskId)))
      .orderBy(desc(taskActivity.createdAt));

    return {
      id: task.task.id,
      workspaceId: task.task.workspaceId,
      title: task.task.title,
      description: task.task.description,
      status: task.task.status,
      simplifiedStatus: mapToSimplifiedStatus(task.task.status),
      priority: task.task.priority,
      dueAt: task.task.dueAt ? task.task.dueAt.toISOString() : null,
      customerId: task.task.customerId,
      customerName: task.customerName ?? null,
      siteId: task.task.siteId,
      siteName: task.siteName ?? null,
      requiresSignature: task.task.requiresSignature,
      requiresPhotoProof: task.task.requiresPhotoProof,
      verifiedBy: task.task.verifiedBy,
      verifierName,
      verifiedAt: task.task.verifiedAt ? task.task.verifiedAt.toISOString() : null,
      verificationNotes: task.task.verificationNotes,
      createdBy: task.task.createdBy,
      creatorName: task.creatorName,
      version: task.task.version,
      assignees: assigneesRows.map((a: any) => ({
        id: a.id,
        taskId: a.taskId,
        userId: a.userId,
        name: a.name,
        email: a.email,
        assignedAt: a.assignedAt.toISOString(),
      })),
      checklist: checklistRows.map((c: any) => ({
        id: c.id,
        taskId: c.taskId,
        title: c.title,
        isCompleted: c.isCompleted,
        sortOrder: c.sortOrder,
        completedBy: c.completedBy,
        completedAt: c.completedAt ? c.completedAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
      })),
      comments: commentsRows.map((m: any) => ({
        id: m.id,
        taskId: m.taskId,
        authorId: m.authorId,
        authorName: m.authorName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      activities: activityRows.map((act: any) => ({
        id: act.id,
        taskId: act.taskId,
        actorId: act.actorId,
        actorName: act.actorName,
        action: act.action,
        fromStatus: act.fromStatus,
        toStatus: act.toStatus,
        details: act.details,
        createdAt: act.createdAt.toISOString(),
      })),
      createdAt: task.task.createdAt.toISOString(),
      updatedAt: task.task.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves single task by ID.
   */
  async getTaskById(workspaceId: string, taskId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);
      return this.getTaskByIdInternal(tx, workspaceId, taskId);
    });
  }

  /**
   * Lists tasks in workspace with filters and pagination.
   */
  async listTasks(workspaceId: string, filters: TaskFilterDto, restrictToAssigneeId?: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const conditions = [eq(tasks.workspaceId, workspaceId)];

      if (filters.status) {
        conditions.push(eq(tasks.status, filters.status));
      }
      if (filters.priority) {
        conditions.push(eq(tasks.priority, filters.priority));
      }
      if (filters.overdue === 'true') {
        conditions.push(
          sql`${tasks.dueAt} IS NOT NULL AND ${tasks.dueAt} < NOW() AND ${tasks.status} NOT IN ('COMPLETED', 'VERIFIED')`,
        );
      }

      // If user is restricted to own tasks or filtering by assignee
      const targetAssigneeId = restrictToAssigneeId || filters.assigneeId;

      let taskIdsFilter: string[] | null = null;
      if (targetAssigneeId) {
        const assignedTaskRows = await tx
          .select({ taskId: taskAssignees.taskId })
          .from(taskAssignees)
          .where(
            and(
              eq(taskAssignees.workspaceId, workspaceId),
              eq(taskAssignees.userId, targetAssigneeId),
            ),
          );
        taskIdsFilter = assignedTaskRows.map((r: any) => r.taskId);
        if (taskIdsFilter.length === 0) {
          return { tasks: [], total: 0 };
        }
        conditions.push(inArray(tasks.id, taskIdsFilter));
      }

      const rows = await tx
        .select({
          task: tasks,
          creatorName: users.name,
          customerName: customers.name,
          siteName: customerSites.name,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.createdBy, users.id))
        .leftJoin(customers, eq(tasks.customerId, customers.id))
        .leftJoin(customerSites, eq(tasks.siteId, customerSites.id))
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt));

      if (rows.length === 0) {
        return { tasks: [], total: 0 };
      }

      const taskIds = rows.map((r: any) => r.task.id);

      // Batch load assignees
      const allAssignees = await tx
        .select({
          id: taskAssignees.id,
          taskId: taskAssignees.taskId,
          userId: taskAssignees.userId,
          name: users.name,
          email: users.email,
          assignedAt: taskAssignees.assignedAt,
        })
        .from(taskAssignees)
        .innerJoin(users, eq(taskAssignees.userId, users.id))
        .where(
          and(eq(taskAssignees.workspaceId, workspaceId), inArray(taskAssignees.taskId, taskIds)),
        );

      const assigneesByTaskId: Record<string, any[]> = {};
      for (const a of allAssignees) {
        if (!assigneesByTaskId[a.taskId]) assigneesByTaskId[a.taskId] = [];
        assigneesByTaskId[a.taskId].push({
          id: a.id,
          taskId: a.taskId,
          userId: a.userId,
          name: a.name,
          email: a.email,
          assignedAt: a.assignedAt.toISOString(),
        });
      }

      const result = rows.map((r: any) => ({
        id: r.task.id,
        workspaceId: r.task.workspaceId,
        title: r.task.title,
        description: r.task.description,
        status: r.task.status,
        simplifiedStatus: mapToSimplifiedStatus(r.task.status),
        priority: r.task.priority,
        dueAt: r.task.dueAt ? r.task.dueAt.toISOString() : null,
        customerId: r.task.customerId,
        customerName: r.customerName ?? null,
        siteId: r.task.siteId,
        siteName: r.siteName ?? null,
        requiresSignature: r.task.requiresSignature,
        requiresPhotoProof: r.task.requiresPhotoProof,
        verifiedBy: r.task.verifiedBy,
        verifiedAt: r.task.verifiedAt ? r.task.verifiedAt.toISOString() : null,
        verificationNotes: r.task.verificationNotes,
        createdBy: r.task.createdBy,
        creatorName: r.creatorName,
        version: r.task.version,
        assignees: assigneesByTaskId[r.task.id] ?? [],
        createdAt: r.task.createdAt.toISOString(),
        updatedAt: r.task.updatedAt.toISOString(),
      }));

      return {
        tasks: result,
        total: result.length,
      };
    });
  }

  /**
   * Updates task mutable fields with optimistic concurrency check.
   */
  async updateTask(
    workspaceId: string,
    taskId: string,
    actorId: string,
    _actorName: string,
    input: UpdateTaskDto,
    canAssign: boolean,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [current] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

      if (!current) {
        const error = new Error('Task not found');
        (error as any).statusCode = 404;
        throw error;
      }

      // Optimistic concurrency check
      if (current.version !== input.version) {
        const error = new Error(
          `Version conflict: task has version ${current.version}, client sent ${input.version}`,
        );
        (error as any).statusCode = 409;
        throw error;
      }

      const updates: Record<string, any> = {
        version: current.version + 1,
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.priority !== undefined) updates.priority = input.priority;
      if (input.dueAt !== undefined) updates.dueAt = input.dueAt ? new Date(input.dueAt) : null;
      if (input.customerId !== undefined) updates.customerId = input.customerId;
      if (input.siteId !== undefined) updates.siteId = input.siteId;
      if (input.requiresSignature !== undefined)
        updates.requiresSignature = input.requiresSignature;
      if (input.requiresPhotoProof !== undefined)
        updates.requiresPhotoProof = input.requiresPhotoProof;

      await tx
        .update(tasks)
        .set(updates)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

      // Handle reassignments if provided and permitted
      if (input.assigneeIds !== undefined) {
        if (!canAssign) {
          const error = new Error('Permission denied: cannot modify task assignees');
          (error as any).statusCode = 403;
          throw error;
        }

        await this.validateAssignees(tx, workspaceId, input.assigneeIds);

        // Delete existing assignees
        await tx
          .delete(taskAssignees)
          .where(and(eq(taskAssignees.workspaceId, workspaceId), eq(taskAssignees.taskId, taskId)));

        // Insert new assignees
        if (input.assigneeIds.length > 0) {
          await tx.insert(taskAssignees).values(
            input.assigneeIds.map((userId) => ({
              workspaceId,
              taskId,
              userId,
              assignedBy: actorId,
            })),
          );
        }

        await tx.insert(taskActivity).values({
          workspaceId,
          taskId,
          actorId,
          action: 'task.assigned',
          details: { newAssignees: input.assigneeIds },
        });
      }

      // Record update activity
      await tx.insert(taskActivity).values({
        workspaceId,
        taskId,
        actorId,
        action: 'task.updated',
        details: { changes: Object.keys(updates) },
      });

      return this.getTaskByIdInternal(tx, workspaceId, taskId);
    });
  }

  /**
   * Executes a validated state transition with optimistic concurrency check.
   */
  async transitionTask(
    workspaceId: string,
    taskId: string,
    actorId: string,
    actorPermissions: string[],
    targetStatus: string,
    clientVersion: number,
    comment?: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [current] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

      if (!current) {
        const error = new Error('Task not found');
        (error as any).statusCode = 404;
        throw error;
      }

      // Optimistic concurrency check
      if (current.version !== clientVersion) {
        const error = new Error(
          `Version conflict: task has version ${current.version}, client sent ${clientVersion}`,
        );
        (error as any).statusCode = 409;
        throw error;
      }

      // Validate status transition rule
      const allowedNext = VALID_TASK_TRANSITIONS[current.status] || [];
      if (!allowedNext.includes(targetStatus)) {
        const error = new Error(
          `Invalid status transition from ${current.status} to ${targetStatus}. Allowed: [${allowedNext.join(', ')}]`,
        );
        (error as any).statusCode = 400;
        throw error;
      }

      // Permission guards for specific transitions
      if (targetStatus === 'VERIFIED') {
        if (!actorPermissions.includes('tasks.verify')) {
          const error = new Error('Permission denied: tasks.verify required to verify task');
          (error as any).statusCode = 403;
          throw error;
        }
      }

      if (targetStatus === 'COMPLETED') {
        if (!actorPermissions.includes('tasks.complete')) {
          const error = new Error('Permission denied: tasks.complete required to complete task');
          (error as any).statusCode = 403;
          throw error;
        }

        // Invariant: Mandatory checklist completion
        const incompleteItems = await tx
          .select({ id: taskChecklistItems.id })
          .from(taskChecklistItems)
          .where(
            and(
              eq(taskChecklistItems.workspaceId, workspaceId),
              eq(taskChecklistItems.taskId, taskId),
              eq(taskChecklistItems.isCompleted, false),
            ),
          );

        if (incompleteItems.length > 0) {
          const error = new Error('Cannot complete task: all checklist items must be completed');
          (error as any).statusCode = 400;
          throw error;
        }

        // Invariant: Mandatory photo proof
        if (current.requiresPhotoProof) {
          const [photoProof] = await tx
            .select({ id: taskProofs.id })
            .from(taskProofs)
            .where(
              and(
                eq(taskProofs.workspaceId, workspaceId),
                eq(taskProofs.taskId, taskId),
                eq(taskProofs.proofType, 'PHOTO'),
              ),
            )
            .limit(1);

          if (!photoProof) {
            const error = new Error('Cannot complete task: mandatory photo proof is required');
            (error as any).statusCode = 400;
            throw error;
          }
        }

        // Invariant: Mandatory on-glass customer digital signature
        if (current.requiresSignature) {
          const [sigProof] = await tx
            .select({ id: taskProofs.id })
            .from(taskProofs)
            .where(
              and(
                eq(taskProofs.workspaceId, workspaceId),
                eq(taskProofs.taskId, taskId),
                eq(taskProofs.proofType, 'SIGNATURE'),
              ),
            )
            .limit(1);

          if (!sigProof) {
            const error = new Error(
              'Cannot complete task: mandatory customer signature is required',
            );
            (error as any).statusCode = 400;
            throw error;
          }
        }
      }

      // Update task status and increment version
      await tx
        .update(tasks)
        .set({
          status: targetStatus,
          version: current.version + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

      // If transition includes comment, record it
      if (comment) {
        await tx.insert(taskComments).values({
          workspaceId,
          taskId,
          authorId: actorId,
          content: comment,
        });
      }

      // Record activity
      await tx.insert(taskActivity).values({
        workspaceId,
        taskId,
        actorId,
        action: `task.status_changed`,
        fromStatus: current.status,
        toStatus: targetStatus,
        details: { comment: comment ?? null },
      });

      return this.getTaskByIdInternal(tx, workspaceId, taskId);
    });
  }

  /**
   * Adds a checklist item to a task.
   */
  async addChecklistItem(workspaceId: string, taskId: string, title: string, sortOrder = 0) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [item] = await tx
        .insert(taskChecklistItems)
        .values({
          workspaceId,
          taskId,
          title,
          sortOrder,
          isCompleted: false,
        })
        .returning();

      return {
        id: item.id,
        taskId: item.taskId,
        title: item.title,
        isCompleted: item.isCompleted,
        sortOrder: item.sortOrder,
        completedBy: item.completedBy,
        completedAt: item.completedAt ? item.completedAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
      };
    });
  }

  /**
   * Toggles checklist item completion state.
   */
  async updateChecklistItem(
    workspaceId: string,
    taskId: string,
    itemId: string,
    userId: string,
    isCompleted: boolean,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [updated] = await tx
        .update(taskChecklistItems)
        .set({
          isCompleted,
          completedBy: isCompleted ? userId : null,
          completedAt: isCompleted ? new Date() : null,
        })
        .where(
          and(
            eq(taskChecklistItems.workspaceId, workspaceId),
            eq(taskChecklistItems.taskId, taskId),
            eq(taskChecklistItems.id, itemId),
          ),
        )
        .returning();

      if (!updated) {
        const error = new Error('Checklist item not found');
        (error as any).statusCode = 404;
        throw error;
      }

      return {
        id: updated.id,
        taskId: updated.taskId,
        title: updated.title,
        isCompleted: updated.isCompleted,
        sortOrder: updated.sortOrder,
        completedBy: updated.completedBy,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
      };
    });
  }

  /**
   * Adds an operational comment to a task.
   */
  async addComment(workspaceId: string, taskId: string, authorId: string, content: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [comment] = await tx
        .insert(taskComments)
        .values({
          workspaceId,
          taskId,
          authorId,
          content,
        })
        .returning();

      const [author] = await tx
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, authorId));

      await tx.insert(taskActivity).values({
        workspaceId,
        taskId,
        actorId: authorId,
        action: 'comment.created',
        details: { preview: content.substring(0, 50) },
      });

      return {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        authorName: author?.name ?? 'User',
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      };
    });
  }

  /**
   * Manager / Supervisor verification queue action (VERIFY or REJECT).
   */
  async verifyTask(
    workspaceId: string,
    taskId: string,
    verifierId: string,
    action: 'VERIFY' | 'REJECT',
    notes?: string,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [current] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

      if (!current) {
        const error = new Error('Task not found');
        (error as any).statusCode = 404;
        throw error;
      }

      if (current.status !== 'COMPLETED' && current.status !== 'VERIFIED') {
        const error = new Error(
          `Cannot verify/reject task with status ${current.status}. Task must be in COMPLETED status.`,
        );
        (error as any).statusCode = 400;
        throw error;
      }

      if (action === 'VERIFY') {
        await tx
          .update(tasks)
          .set({
            status: 'VERIFIED',
            verifiedBy: verifierId,
            verifiedAt: new Date(),
            verificationNotes: notes ?? null,
            version: current.version + 1,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

        await tx.insert(taskActivity).values({
          workspaceId,
          taskId,
          actorId: verifierId,
          action: 'task.verified',
          fromStatus: current.status,
          toStatus: 'VERIFIED',
          details: { notes },
        });
      } else {
        // REJECT sends back to IN_PROGRESS so field technician can remediate
        await tx
          .update(tasks)
          .set({
            status: 'IN_PROGRESS',
            verifiedBy: null,
            verifiedAt: null,
            verificationNotes: notes ?? 'Rejected by manager',
            version: current.version + 1,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)));

        await tx.insert(taskActivity).values({
          workspaceId,
          taskId,
          actorId: verifierId,
          action: 'task.rejected',
          fromStatus: current.status,
          toStatus: 'IN_PROGRESS',
          details: { notes },
        });
      }

      return this.getTaskByIdInternal(tx, workspaceId, taskId);
    });
  }
}
