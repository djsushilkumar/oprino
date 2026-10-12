import { eq, and, ne, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import type { Database } from '@oprino/database';
import {
  workspaces,
  roles,
  rolePermissions,
  workspaceMemberships,
  auditLogs,
  sessions,
  users,
} from '@oprino/database/schema';
import { DEFAULT_ROLE_TEMPLATES } from '../auth/permissions.js';
import type { Auth } from '../auth/better-auth.js';

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

export class WorkspaceService {
  constructor(private db: Database) {}

  /**
   * Atomically provisions workspace, default roles, permissions, owner membership,
   * audit log event, and updates active session context.
   * If any step fails, the entire transaction rolls back cleanly.
   */
  async createWorkspaceAtomic(userId: string, input: CreateWorkspaceInput, sessionId?: string) {
    const rawSlug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const slug = `${rawSlug}-${Math.random().toString(36).substring(2, 7)}`;

    return this.db.transaction(async (tx) => {
      // 1. Create Workspace
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          name: input.name,
          slug,
          status: 'ACTIVE',
        })
        .returning();

      if (!workspace) {
        throw new Error('Failed to create workspace');
      }

      // Set tenant context for subsequent tenant-scoped inserts
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspace.id}, true)`);

      // 2. Create Default Roles & Permissions
      const createdRoles: Record<string, { id: string; name: string }> = {};

      for (const [key, template] of Object.entries(DEFAULT_ROLE_TEMPLATES)) {
        const [role] = await tx
          .insert(roles)
          .values({
            workspaceId: workspace.id,
            name: template.name,
            description: template.description,
            isSystemDefault: template.isSystemDefault,
          })
          .returning();

        if (!role) {
          throw new Error(`Failed to create default role: ${template.name}`);
        }

        createdRoles[key] = { id: role.id, name: role.name };

        // Attach permissions
        if (template.permissions.length > 0) {
          await tx.insert(rolePermissions).values(
            template.permissions.map((perm) => ({
              workspaceId: workspace.id,
              roleId: role.id,
              permission: perm,
            })),
          );
        }
      }

      // 3. Assign Owner/Admin role to creating user
      const ownerRole = createdRoles.OWNER;
      const [membership] = await tx
        .insert(workspaceMemberships)
        .values({
          workspaceId: workspace.id,
          userId,
          roleId: ownerRole.id,
          status: 'active',
        })
        .returning();

      if (!membership) {
        throw new Error('Failed to create owner membership');
      }

      // 4. Create Audit Log Entry
      await tx.insert(auditLogs).values({
        workspaceId: workspace.id,
        actorId: userId,
        action: 'workspace.created',
        targetType: 'workspace',
        targetId: workspace.id,
        metadata: {
          name: workspace.name,
          slug: workspace.slug,
          ownerRoleId: ownerRole.id,
        },
      });

      // 5. Update session's activeWorkspaceId if session provided
      if (sessionId) {
        await tx
          .update(sessions)
          .set({
            activeWorkspaceId: workspace.id,
            updatedAt: new Date(),
          })
          .where(eq(sessions.id, sessionId));
      }

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        status: workspace.status,
        role: ownerRole.name,
        permissions: DEFAULT_ROLE_TEMPLATES.OWNER.permissions,
        createdAt: workspace.createdAt.toISOString(),
      };
    });
  }

  /**
   * Lists all workspaces where user holds a membership, excluding removed memberships.
   */
  async listUserWorkspaces(userId: string) {
    // Run in system context to allow querying across user's memberships
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const rows = await tx
        .select({
          workspaceId: workspaces.id,
          workspaceName: workspaces.name,
          workspaceSlug: workspaces.slug,
          workspaceStatus: workspaces.status,
          membershipStatus: workspaceMemberships.status,
          roleName: roles.name,
        })
        .from(workspaceMemberships)
        .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
        .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
        .where(
          and(eq(workspaceMemberships.userId, userId), ne(workspaceMemberships.status, 'removed')),
        );

      return rows.map((r) => ({
        id: r.workspaceId,
        name: r.workspaceName,
        slug: r.workspaceSlug,
        status: r.workspaceStatus,
        membershipStatus: r.membershipStatus,
        roleName: r.roleName,
      }));
    });
  }

  /**
   * 5-Stage Active Workspace Switch
   * Verifies membership exists and is active, updates session, and emits audit event.
   */
  async switchActiveWorkspace(userId: string, workspaceId: string, sessionId?: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      // 1. Verify membership
      const [membership] = await tx
        .select({
          id: workspaceMemberships.id,
          status: workspaceMemberships.status,
          roleId: workspaceMemberships.roleId,
          roleName: roles.name,
          workspaceName: workspaces.name,
        })
        .from(workspaceMemberships)
        .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
        .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
        .where(
          and(
            eq(workspaceMemberships.userId, userId),
            eq(workspaceMemberships.workspaceId, workspaceId),
          ),
        );

      if (!membership || membership.status === 'removed') {
        const err = new Error('Invalid or inactive workspace membership');
        (err as any).statusCode = 403;
        (err as any).code = 'MEMBERSHIP_INVALID';
        throw err;
      }

      if (membership.status === 'suspended') {
        const err = new Error('Workspace membership is suspended');
        (err as any).statusCode = 403;
        (err as any).code = 'MEMBERSHIP_SUSPENDED';
        throw err;
      }

      // 2. Fetch role permissions
      const perms = await tx
        .select({ permission: rolePermissions.permission })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, membership.roleId));

      const permissionsList = perms.map((p) => p.permission);

      // 3. Update session
      if (sessionId) {
        await tx
          .update(sessions)
          .set({
            activeWorkspaceId: workspaceId,
            updatedAt: new Date(),
          })
          .where(eq(sessions.id, sessionId));
      }

      // 4. Emit Audit Event
      await tx.insert(auditLogs).values({
        workspaceId,
        actorId: userId,
        action: 'workspace.switched',
        targetType: 'workspace',
        targetId: workspaceId,
        metadata: {
          role: membership.roleName,
          sessionId,
        },
      });

      return {
        activeWorkspaceId: workspaceId,
        name: membership.workspaceName,
        role: membership.roleName,
        permissions: permissionsList,
      };
    });
  }

  /**
   * List all members of a workspace with user profile details and assigned role.
   */
  async listWorkspaceMembers(workspaceId: string) {
    return this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        membershipId: workspaceMemberships.id,
        roleId: workspaceMemberships.roleId,
        roleName: roles.name,
        status: workspaceMemberships.status,
      })
      .from(workspaceMemberships)
      .innerJoin(users, eq(workspaceMemberships.userId, users.id))
      .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
      .where(
        and(
          eq(workspaceMemberships.workspaceId, workspaceId),
          ne(workspaceMemberships.status, 'removed'),
        ),
      );
  }

  /**
   * Add a new member to an active workspace with specified role.
   */
  async addWorkspaceMember(
    workspaceId: string,
    actorId: string,
    input: {
      name: string;
      email: string;
      password?: string;
      roleName: 'Employee' | 'Manager';
    },
    auth?: Auth,
  ) {
    const email = input.email.toLowerCase().trim();
    const name = input.name.trim();

    // 1. Look for existing user by email
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let targetUserId: string;

    if (existingUser) {
      targetUserId = existingUser.id;

      // Check if user already holds active membership in this workspace
      const [existingMembership] = await this.db
        .select()
        .from(workspaceMemberships)
        .where(
          and(
            eq(workspaceMemberships.workspaceId, workspaceId),
            eq(workspaceMemberships.userId, targetUserId),
          ),
        )
        .limit(1);

      if (existingMembership && existingMembership.status === 'active') {
        const error: any = new Error('This user is already an active member of this workspace');
        error.statusCode = 409;
        throw error;
      }
    } else {
      // Create user via Better-Auth if auth is provided, else direct insert
      if (auth && input.password) {
        const created = await auth.api.signUpEmail({
          body: {
            email,
            password: input.password,
            name,
          },
        });
        targetUserId = created.user.id;
      } else {
        const [newUser] = await this.db
          .insert(users)
          .values({
            id: crypto.randomUUID(),
            name,
            email,
            emailVerified: false,
          })
          .returning();
        targetUserId = newUser.id;
      }
    }

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 2. Find target role in workspace
      const targetRoleName = input.roleName === 'Manager' ? 'Manager' : 'Employee';
      const [targetRole] = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.workspaceId, workspaceId), eq(roles.name, targetRoleName)))
        .limit(1);

      if (!targetRole) {
        throw new Error(`Role '${targetRoleName}' not found in workspace`);
      }

      // 3. Create or update membership
      const [membership] = await tx
        .insert(workspaceMemberships)
        .values({
          workspaceId,
          userId: targetUserId,
          roleId: targetRole.id,
          status: 'active',
        })
        .onConflictDoUpdate({
          target: [workspaceMemberships.workspaceId, workspaceMemberships.userId],
          set: {
            roleId: targetRole.id,
            status: 'active',
            updatedAt: new Date(),
          },
        })
        .returning();

      // 4. Audit Log
      await tx.insert(auditLogs).values({
        workspaceId,
        actorId,
        action: 'member.added',
        targetType: 'user',
        targetId: targetUserId,
        metadata: {
          roleId: targetRole.id,
          roleName: targetRole.name,
          email,
          name,
        },
      });

      return {
        id: targetUserId,
        name,
        email,
        image: null,
        membershipId: membership.id,
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'active',
      };
    });
  }
}

