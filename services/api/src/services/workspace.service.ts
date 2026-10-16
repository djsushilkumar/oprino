import { eq, and, ne, desc, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import type { Database } from '@oprino/database';
import {
  workspaces,
  roles,
  rolePermissions,
  workspaceMemberships,
  workspaceInvitations,
  userDevices,
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

  /**
   * BLK-002: Secure Employee Invitation Workflow
   * Generates a single-use cryptographically secure token with SHA-256 hash.
   */
  async createInvitation(
    workspaceId: string,
    invitedBy: string,
    input: { email: string; name?: string; roleName: 'Employee' | 'Manager' },
    baseUrl: string,
  ) {
    const email = input.email.trim().toLowerCase();
    const name = input.name?.trim() || null;

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 1. Check if user already has active membership in this workspace
      const [existingActiveMember] = await tx
        .select({ id: workspaceMemberships.id })
        .from(workspaceMemberships)
        .innerJoin(users, eq(workspaceMemberships.userId, users.id))
        .where(
          and(
            eq(workspaceMemberships.workspaceId, workspaceId),
            eq(users.email, email),
            eq(workspaceMemberships.status, 'active'),
          ),
        )
        .limit(1);

      if (existingActiveMember) {
        const error: any = new Error('This user is already an active member of this workspace');
        error.statusCode = 409;
        throw error;
      }

      // 2. Resolve Role
      const targetRoleName = input.roleName === 'Manager' ? 'Manager' : 'Employee';
      const [targetRole] = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.workspaceId, workspaceId), eq(roles.name, targetRoleName)))
        .limit(1);

      if (!targetRole) {
        throw new Error(`Role '${targetRoleName}' not found in workspace`);
      }

      // 3. Generate cryptographic 256-bit token & SHA-256 hash
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiration

      // 4. Invalidate any existing PENDING invitation for this email in this workspace
      await tx
        .update(workspaceInvitations)
        .set({ status: 'REVOKED', updatedAt: new Date() })
        .where(
          and(
            eq(workspaceInvitations.workspaceId, workspaceId),
            eq(workspaceInvitations.email, email),
            eq(workspaceInvitations.status, 'PENDING'),
          ),
        );

      // 5. Insert new invitation
      const [invitation] = await tx
        .insert(workspaceInvitations)
        .values({
          workspaceId,
          email,
          name,
          roleId: targetRole.id,
          invitedBy,
          tokenHash,
          status: 'PENDING',
          expiresAt,
        })
        .returning();

      // 6. Record Audit Log
      await tx.insert(auditLogs).values({
        workspaceId,
        actorId: invitedBy,
        action: 'invitation.created',
        targetType: 'invitation',
        targetId: invitation.id,
        metadata: {
          email,
          roleName: targetRole.name,
          expiresAt: expiresAt.toISOString(),
        },
      });

      const invitationUrl = `${baseUrl.replace(/\/+$/, '')}/auth/activate?token=${rawToken}`;

      return {
        id: invitation.id,
        workspaceId: invitation.workspaceId,
        email: invitation.email,
        name: invitation.name,
        roleName: targetRole.name,
        status: invitation.status as any,
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
        invitationUrl,
      };
    });
  }

  /**
   * Lists all workspace invitations.
   */
  async listWorkspaceInvitations(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const rows = await tx
        .select({
          invitation: workspaceInvitations,
          roleName: roles.name,
        })
        .from(workspaceInvitations)
        .innerJoin(roles, eq(workspaceInvitations.roleId, roles.id))
        .where(eq(workspaceInvitations.workspaceId, workspaceId))
        .orderBy(desc(workspaceInvitations.createdAt));

      const now = new Date();
      return rows.map((r) => {
        let status = r.invitation.status;
        if (status === 'PENDING' && r.invitation.expiresAt < now) {
          status = 'EXPIRED';
        }
        return {
          id: r.invitation.id,
          workspaceId: r.invitation.workspaceId,
          email: r.invitation.email,
          name: r.invitation.name,
          roleName: r.roleName,
          status: status as any,
          expiresAt: r.invitation.expiresAt.toISOString(),
          createdAt: r.invitation.createdAt.toISOString(),
        };
      });
    });
  }

  /**
   * Revokes an existing invitation.
   */
  async revokeInvitation(workspaceId: string, invitationId: string, actorId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [invitation] = await tx
        .select()
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.workspaceId, workspaceId),
            eq(workspaceInvitations.id, invitationId),
          ),
        )
        .limit(1);

      if (!invitation) {
        const error: any = new Error('Invitation not found');
        error.statusCode = 404;
        throw error;
      }

      await tx
        .update(workspaceInvitations)
        .set({ status: 'REVOKED', updatedAt: new Date() })
        .where(eq(workspaceInvitations.id, invitationId));

      await tx.insert(auditLogs).values({
        workspaceId,
        actorId,
        action: 'invitation.revoked',
        targetType: 'invitation',
        targetId: invitationId,
        metadata: { email: invitation.email },
      });

      return { success: true };
    });
  }

  /**
   * Validates invitation token without exposing sensitive internal IDs.
   */
  async validateInvitationToken(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [row] = await tx
        .select({
          invitation: workspaceInvitations,
          workspaceName: workspaces.name,
          roleName: roles.name,
        })
        .from(workspaceInvitations)
        .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
        .innerJoin(roles, eq(workspaceInvitations.roleId, roles.id))
        .where(eq(workspaceInvitations.tokenHash, tokenHash))
        .limit(1);

      if (!row) {
        return { valid: false, reason: 'INVITATION_NOT_FOUND' };
      }

      if (row.invitation.status !== 'PENDING') {
        return { valid: false, reason: `INVITATION_${row.invitation.status}` };
      }

      if (row.invitation.expiresAt < new Date()) {
        await tx
          .update(workspaceInvitations)
          .set({ status: 'EXPIRED', updatedAt: new Date() })
          .where(eq(workspaceInvitations.id, row.invitation.id));
        return { valid: false, reason: 'INVITATION_EXPIRED' };
      }

      return {
        valid: true,
        email: row.invitation.email,
        name: row.invitation.name,
        workspaceName: row.workspaceName,
        roleName: row.roleName,
        expiresAt: row.invitation.expiresAt.toISOString(),
      };
    });
  }

  /**
   * Accepts invitation and lets employee set their own credentials.
   */
  async acceptInvitation(input: { token: string; password: string; name?: string }, auth?: Auth) {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.bypass_rls', 'on', true)`);

      const [row] = await tx
        .select({
          invitation: workspaceInvitations,
          workspace: workspaces,
          role: roles,
        })
        .from(workspaceInvitations)
        .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
        .innerJoin(roles, eq(workspaceInvitations.roleId, roles.id))
        .where(eq(workspaceInvitations.tokenHash, tokenHash))
        .for('update')
        .limit(1);

      if (!row) {
        const error: any = new Error('Invalid or non-existent activation token');
        error.statusCode = 404;
        throw error;
      }

      if (row.invitation.status !== 'PENDING') {
        const error: any = new Error(`Invitation is already ${row.invitation.status.toLowerCase()}`);
        error.statusCode = 400;
        throw error;
      }

      if (row.invitation.expiresAt < new Date()) {
        await tx
          .update(workspaceInvitations)
          .set({ status: 'EXPIRED', updatedAt: new Date() })
          .where(eq(workspaceInvitations.id, row.invitation.id));
        const error: any = new Error('Invitation has expired. Please ask your administrator to resend it.');
        error.statusCode = 400;
        throw error;
      }

      const email = row.invitation.email.toLowerCase();
      const displayName = input.name?.trim() || row.invitation.name || email.split('@')[0];

      // Check if user already exists
      const [existingUser] = await tx
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let targetUserId: string;

      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        if (auth) {
          const created = await auth.api.signUpEmail({
            body: {
              email,
              password: input.password,
              name: displayName,
            },
          });
          targetUserId = created.user.id;
        } else {
          const [newUser] = await tx
            .insert(users)
            .values({
              id: crypto.randomUUID(),
              name: displayName,
              email,
              emailVerified: true,
            })
            .returning();
          targetUserId = newUser.id;
        }
      }

      // Mark invitation accepted
      const acceptedAt = new Date();
      await tx
        .update(workspaceInvitations)
        .set({ status: 'ACCEPTED', acceptedAt, updatedAt: acceptedAt })
        .where(eq(workspaceInvitations.id, row.invitation.id));

      // Provision workspace membership
      await tx
        .insert(workspaceMemberships)
        .values({
          workspaceId: row.invitation.workspaceId,
          userId: targetUserId,
          roleId: row.role.id,
          status: 'active',
        })
        .onConflictDoUpdate({
          target: [workspaceMemberships.workspaceId, workspaceMemberships.userId],
          set: {
            roleId: row.role.id,
            status: 'active',
            updatedAt: acceptedAt,
          },
        });

      // Audit log
      await tx.insert(auditLogs).values({
        workspaceId: row.invitation.workspaceId,
        actorId: targetUserId,
        action: 'invitation.accepted',
        targetType: 'invitation',
        targetId: row.invitation.id,
        metadata: {
          email,
          userId: targetUserId,
          roleName: row.role.name,
        },
      });

      return {
        success: true,
        userId: targetUserId,
        email,
        workspaceId: row.invitation.workspaceId,
        workspaceName: row.workspace.name,
        roleName: row.role.name,
      };
    });
  }

  /**
   * BLK-003: Bulk Employee Onboarding from CSV
   * Bounded batch (max 100 rows), CSV injection prevention, and row-level results.
   */
  async bulkImportMembersCsv(
    workspaceId: string,
    actorId: string,
    rows: Array<{ name: string; email: string; role: 'Employee' | 'Manager' }>,
    baseUrl: string,
  ) {
    if (rows.length > 100) {
      const error: any = new Error('Batch size exceeds maximum limit of 100 employees per import');
      error.statusCode = 400;
      throw error;
    }

    const results: Array<{
      row: number;
      email: string;
      name?: string;
      status: 'INVITED' | 'FAILED' | 'SKIPPED';
      error?: string;
      invitationUrl?: string;
    }> = [];

    const seenEmailsInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const raw = rows[i];

      // CSV Injection Sanitization: if field begins with formula trigger, escape with single quote
      const sanitizeCsvField = (val: string) => {
        if (/^[=+\-@\t\r]/.test(val)) {
          return `'${val}`;
        }
        return val;
      };

      const email = raw.email?.trim().toLowerCase();
      const name = raw.name ? sanitizeCsvField(raw.name.trim()) : '';
      const role = raw.role === 'Manager' ? 'Manager' : 'Employee';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({
          row: rowNum,
          email: email || 'unknown',
          name,
          status: 'FAILED',
          error: 'Invalid or missing email address',
        });
        continue;
      }

      if (seenEmailsInBatch.has(email)) {
        results.push({
          row: rowNum,
          email,
          name,
          status: 'SKIPPED',
          error: 'Duplicate email within import batch',
        });
        continue;
      }
      seenEmailsInBatch.add(email);

      try {
        const inv = await this.createInvitation(workspaceId, actorId, { email, name, roleName: role }, baseUrl);
        results.push({
          row: rowNum,
          email,
          name,
          status: 'INVITED',
          invitationUrl: inv.invitationUrl,
        });
      } catch (err: any) {
        results.push({
          row: rowNum,
          email,
          name,
          status: 'FAILED',
          error: err.message || 'Failed to create invitation',
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'INVITED').length;
    const failureCount = results.filter((r) => r.status === 'FAILED' || r.status === 'SKIPPED').length;

    return {
      totalRows: rows.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * BLK-005: Employee Lifecycle Management
   * Role modification, status transition (active, suspended, removed), manager assignment,
   * with last-active-owner protection and device revocation.
   */
  async updateWorkspaceMember(
    workspaceId: string,
    actorId: string,
    membershipId: string,
    input: {
      roleName?: 'Owner/Admin' | 'Manager' | 'Employee';
      status?: 'active' | 'suspended' | 'removed';
      managerId?: string | null;
    },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      // 1. Fetch current target membership with role
      const [targetMembership] = await tx
        .select({
          membership: workspaceMemberships,
          user: users,
          role: roles,
        })
        .from(workspaceMemberships)
        .innerJoin(users, eq(workspaceMemberships.userId, users.id))
        .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
        .where(
          and(
            eq(workspaceMemberships.workspaceId, workspaceId),
            eq(workspaceMemberships.id, membershipId),
          ),
        )
        .limit(1);

      if (!targetMembership) {
        const error: any = new Error('Workspace member not found');
        error.statusCode = 404;
        throw error;
      }

      const isCurrentOwner = targetMembership.role.name === 'Owner/Admin';
      const willDemoteOrRemoveOwner =
        isCurrentOwner &&
        ((input.roleName && input.roleName !== 'Owner/Admin') ||
          (input.status && input.status !== 'active'));

      if (willDemoteOrRemoveOwner) {
        // Count active owners in workspace
        const [ownerCountRow] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(workspaceMemberships)
          .innerJoin(roles, eq(workspaceMemberships.roleId, roles.id))
          .where(
            and(
              eq(workspaceMemberships.workspaceId, workspaceId),
              eq(roles.name, 'Owner/Admin'),
              eq(workspaceMemberships.status, 'active'),
            ),
          );

        if ((ownerCountRow?.count ?? 0) <= 1) {
          const error: any = new Error('Cannot demote, suspend, or remove the last active Owner of the workspace');
          error.statusCode = 400;
          throw error;
        }
      }

      // 2. Resolve new role if requested
      let newRoleId = targetMembership.membership.roleId;
      let newRoleName = targetMembership.role.name;
      if (input.roleName && input.roleName !== targetMembership.role.name) {
        const [foundRole] = await tx
          .select()
          .from(roles)
          .where(and(eq(roles.workspaceId, workspaceId), eq(roles.name, input.roleName)))
          .limit(1);

        if (!foundRole) {
          throw new Error(`Role '${input.roleName}' not found in workspace`);
        }
        newRoleId = foundRole.id;
        newRoleName = foundRole.name;
      }

      // 3. Update membership
      const updatePayload: Record<string, any> = {
        roleId: newRoleId,
        updatedAt: new Date(),
      };
      if (input.status) {
        updatePayload.status = input.status;
      }
      if (input.managerId !== undefined) {
        updatePayload.managerId = input.managerId;
      }

      const [updated] = await tx
        .update(workspaceMemberships)
        .set(updatePayload)
        .where(eq(workspaceMemberships.id, membershipId))
        .returning();

      // 4. If status is suspended or removed, revoke all registered devices for this user
      if (input.status === 'suspended' || input.status === 'removed') {
        await tx
          .update(userDevices)
          .set({ status: 'revoked', updatedAt: new Date() })
          .where(
            and(
              eq(userDevices.userId, targetMembership.user.id),
              eq(userDevices.workspaceId, workspaceId),
            ),
          );
      }

      // 5. Audit Log
      await tx.insert(auditLogs).values({
        workspaceId,
        actorId,
        action: 'member.updated',
        targetType: 'membership',
        targetId: membershipId,
        metadata: {
          userId: targetMembership.user.id,
          email: targetMembership.user.email,
          previousRole: targetMembership.role.name,
          newRole: newRoleName,
          status: updated.status,
          managerId: updated.managerId,
        },
      });

      return {
        id: targetMembership.user.id,
        name: targetMembership.user.name,
        email: targetMembership.user.email,
        image: targetMembership.user.image,
        membershipId: updated.id,
        roleId: updated.roleId,
        roleName: newRoleName,
        status: updated.status,
        managerId: updated.managerId,
      };
    });
  }

  /**
   * BLK-006 & BLK-004: Workspace Configuration Settings
   */
  async getWorkspaceSettings(workspaceId: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [ws] = await tx
        .select({
          locationRetentionDays: workspaces.locationRetentionDays,
          attendancePolicy: workspaces.attendancePolicy,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (!ws) {
        const error: any = new Error('Workspace not found');
        error.statusCode = 404;
        throw error;
      }

      return {
        locationRetentionDays: (ws.locationRetentionDays ?? 30) as 7 | 30 | 90 | 180,
        attendancePolicy: (ws.attendancePolicy ?? 'SIMPLE') as any,
      };
    });
  }

  async updateWorkspaceSettings(
    workspaceId: string,
    actorId: string,
    input: {
      locationRetentionDays?: 7 | 30 | 90 | 180;
      attendancePolicy?: 'SIMPLE' | 'GPS_REQUIRED' | 'SELFIE_REQUIRED' | 'GPS_AND_SELFIE_REQUIRED' | 'GEOFENCE_REQUIRED';
    },
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`);

      const [current] = await tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (!current) {
        const error: any = new Error('Workspace not found');
        error.statusCode = 404;
        throw error;
      }

      const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
      };
      if (input.locationRetentionDays !== undefined) {
        updatePayload.locationRetentionDays = input.locationRetentionDays;
      }
      if (input.attendancePolicy !== undefined) {
        updatePayload.attendancePolicy = input.attendancePolicy;
      }

      const [updated] = await tx
        .update(workspaces)
        .set(updatePayload)
        .where(eq(workspaces.id, workspaceId))
        .returning();

      // Audit Log
      await tx.insert(auditLogs).values({
        workspaceId,
        actorId,
        action: 'workspace.settings_updated',
        targetType: 'workspace',
        targetId: workspaceId,
        metadata: {
          previousRetention: current.locationRetentionDays,
          newRetention: updated.locationRetentionDays,
          previousPolicy: current.attendancePolicy,
          newPolicy: updated.attendancePolicy,
        },
      });

      return {
        locationRetentionDays: updated.locationRetentionDays as 7 | 30 | 90 | 180,
        attendancePolicy: updated.attendancePolicy as any,
      };
    });
  }
}


