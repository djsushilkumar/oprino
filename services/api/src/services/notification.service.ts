import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '@oprino/database';
import { notifications } from '@oprino/database/schema';
import type {
  NotificationType,
  ListNotificationsResponse,
  MarkNotificationReadResponse,
} from '@oprino/contracts';

export class NotificationService {
  constructor(private db: Database) {}

  /**
   * Creates an in-app operational notification.
   */
  async createNotification(
    workspaceId: string,
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      body: string;
      entityType?: string;
      entityId?: string;
    },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [notification] = await tx
        .insert(notifications)
        .values({
          workspaceId,
          userId,
          type: data.type,
          title: data.title,
          body: data.body,
          entityType: data.entityType ?? null,
          entityId: data.entityId ?? null,
        })
        .returning();

      return notification;
    });
  }

  /**
   * Lists notifications for the authenticated user with unread count.
   */
  async listNotifications(
    workspaceId: string,
    userId: string,
  ): Promise<ListNotificationsResponse> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.workspaceId, workspaceId),
            eq(notifications.userId, userId),
          ),
        )
        .orderBy(sql`${notifications.createdAt} DESC`)
        .limit(50);

      const unreadCount = rows.filter((n) => !n.isRead).length;

      return {
        notifications: rows.map((n) => ({
          id: n.id,
          workspaceId: n.workspaceId,
          userId: n.userId,
          type: n.type as NotificationType,
          title: n.title,
          body: n.body,
          entityType: n.entityType,
          entityId: n.entityId,
          isRead: n.isRead,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        })),
        total: rows.length,
        unreadCount,
      };
    });
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(
    workspaceId: string,
    userId: string,
    notificationId: string,
  ): Promise<MarkNotificationReadResponse> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      await tx
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.workspaceId, workspaceId),
            eq(notifications.userId, userId),
            eq(notifications.id, notificationId),
          ),
        );

      return {
        success: true,
        markedCount: 1,
      };
    });
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(
    workspaceId: string,
    userId: string,
  ): Promise<MarkNotificationReadResponse> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.workspaceId, workspaceId),
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        )
        .returning({ id: notifications.id });

      return {
        success: true,
        markedCount: rows.length,
      };
    });
  }
}
