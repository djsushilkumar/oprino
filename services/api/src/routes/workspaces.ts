import type { FastifyPluginAsync } from 'fastify';
import type { WorkspaceService } from '../services/workspace.service.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import type { Auth } from '../auth/better-auth.js';
import {
  CreateWorkspaceRequestSchema,
  SwitchWorkspaceRequestSchema,
  AddWorkspaceMemberRequestSchema,
  InviteWorkspaceMemberRequestSchema,
  BulkImportMembersRequestSchema,
  UpdateWorkspaceMemberRequestSchema,
  UpdateWorkspaceSettingsRequestSchema,
} from '@oprino/contracts';
import { PERMISSIONS } from '../auth/permissions.js';

export interface WorkspaceRoutesOptions {
  workspaceService: WorkspaceService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  auth?: Auth;
}

export const workspaceRoutes: FastifyPluginAsync<WorkspaceRoutesOptions> = async (app, options) => {
  const { workspaceService, authMiddleware, auth } = options;

  // POST /v1/workspaces - Create Workspace atomically
  app.post('/v1/workspaces', { preHandler: [authMiddleware.authenticate] }, async (req, reply) => {
    const parsed = CreateWorkspaceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid workspace payload',
        details: parsed.error.issues,
      });
    }

    try {
      const workspace = await workspaceService.createWorkspaceAtomic(
        req.user!.id,
        parsed.data,
        req.session?.id,
      );

      return reply.status(201).send(workspace);
    } catch (err: any) {
      req.log.error(err, 'Failed to create workspace');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: err.message || 'Failed to provision workspace',
      });
    }
  });

  // GET /v1/workspaces - List all valid workspaces for authenticated user
  app.get('/v1/workspaces', { preHandler: [authMiddleware.authenticate] }, async (req, reply) => {
    try {
      const workspacesList = await workspaceService.listUserWorkspaces(req.user!.id);
      return reply.status(200).send({ workspaces: workspacesList });
    } catch (err: any) {
      req.log.error(err, 'Failed to list workspaces');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve workspaces',
      });
    }
  });

  // POST /v1/session/workspace - Switch active workspace
  app.post(
    '/v1/session/workspace',
    { preHandler: [authMiddleware.authenticate] },
    async (req, reply) => {
      const parsed = SwitchWorkspaceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid switch workspace payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await workspaceService.switchActiveWorkspace(
          req.user!.id,
          parsed.data.workspaceId,
          req.session?.id,
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        const status = err.statusCode || 400;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'SWITCH_WORKSPACE_FAILED',
          message: err.message || 'Failed to switch workspace context',
        });
      }
    },
  );

  // GET /v1/workspaces/members - List members of active workspace
  app.get(
    '/v1/workspaces/members',
    { preHandler: [authMiddleware.authenticate, authMiddleware.requireWorkspace] },
    async (req, reply) => {
      try {
        const members = await workspaceService.listWorkspaceMembers(req.workspaceId!);
        return reply.status(200).send({ members });
      } catch (err: any) {
        req.log.error(err, 'Failed to list workspace members');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve workspace members',
        });
      }
    },
  );

  // POST /v1/workspaces/members - Add a new member to the active workspace
  app.post(
    '/v1/workspaces/members',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = AddWorkspaceMemberRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid member payload',
          details: parsed.error.issues,
        });
      }

      try {
        const result = await workspaceService.addWorkspaceMember(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
          auth,
        );

        return reply.status(201).send({
          member: result,
          message: `${result.roleName} added successfully`,
        });
      } catch (err: any) {
        req.log.error(err, 'Failed to add workspace member');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'ADD_MEMBER_FAILED',
          message: err.message || 'Failed to add workspace member',
        });
      }
    },
  );

  // POST /v1/workspaces/members/invite - BLK-002: Secure invitation link generation
  app.post(
    '/v1/workspaces/members/invite',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = InviteWorkspaceMemberRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid invitation payload',
          details: parsed.error.issues,
        });
      }

      try {
        const baseUrl =
          (req.headers.origin as string) ||
          (req.headers.referer ? new URL(req.headers.referer as string).origin : '') ||
          process.env.APP_PUBLIC_URL ||
          'http://localhost:3000';

        const invitation = await workspaceService.createInvitation(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
          baseUrl,
        );

        return reply.status(201).send({
          invitation,
          message: `Invitation generated successfully for ${invitation.email}`,
        });
      } catch (err: any) {
        req.log.error(err, 'Failed to create invitation');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'INVITATION_FAILED',
          message: err.message || 'Failed to create workspace invitation',
        });
      }
    },
  );

  // GET /v1/workspaces/members/invitations - List invitations
  app.get(
    '/v1/workspaces/members/invitations',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const invitations = await workspaceService.listWorkspaceInvitations(req.workspaceId!);
        return reply.status(200).send({ invitations });
      } catch (err: any) {
        req.log.error(err, 'Failed to list invitations');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to retrieve workspace invitations',
        });
      }
    },
  );

  // POST /v1/workspaces/members/invitations/:invitationId/revoke - Revoke invitation
  app.post(
    '/v1/workspaces/members/invitations/:invitationId/revoke',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const { invitationId } = req.params as { invitationId: string };
      try {
        await workspaceService.revokeInvitation(req.workspaceId!, invitationId, req.user!.id);
        return reply.status(200).send({ success: true, message: 'Invitation revoked successfully' });
      } catch (err: any) {
        req.log.error(err, 'Failed to revoke invitation');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'REVOKE_FAILED',
          message: err.message || 'Failed to revoke invitation',
        });
      }
    },
  );

  // POST /v1/workspaces/members/import-csv - BLK-003: Bulk employee onboarding
  app.post(
    '/v1/workspaces/members/import-csv',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = BulkImportMembersRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid bulk import payload',
          details: parsed.error.issues,
        });
      }

      try {
        const baseUrl =
          (req.headers.origin as string) ||
          (req.headers.referer ? new URL(req.headers.referer as string).origin : '') ||
          process.env.APP_PUBLIC_URL ||
          'http://localhost:3000';

        const result = await workspaceService.bulkImportMembersCsv(
          req.workspaceId!,
          req.user!.id,
          parsed.data.members,
          baseUrl,
        );

        return reply.status(200).send(result);
      } catch (err: any) {
        req.log.error(err, 'Failed to process bulk member import');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'IMPORT_FAILED',
          message: err.message || 'Failed to process CSV import',
        });
      }
    },
  );

  // PATCH /v1/workspaces/members/:membershipId - BLK-005: Employee lifecycle management
  app.patch(
    '/v1/workspaces/members/:membershipId',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.MEMBERS_MANAGE),
      ],
    },
    async (req, reply) => {
      const { membershipId } = req.params as { membershipId: string };
      const parsed = UpdateWorkspaceMemberRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid member update payload',
          details: parsed.error.issues,
        });
      }

      try {
        const updated = await workspaceService.updateWorkspaceMember(
          req.workspaceId!,
          req.user!.id,
          membershipId,
          parsed.data,
        );

        return reply.status(200).send({
          member: updated,
          message: 'Member updated successfully',
        });
      } catch (err: any) {
        req.log.error(err, 'Failed to update workspace member');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: err.code || 'UPDATE_MEMBER_FAILED',
          message: err.message || 'Failed to update member',
        });
      }
    },
  );

  // GET /v1/workspaces/settings - BLK-006 & BLK-004: Workspace configuration
  app.get(
    '/v1/workspaces/settings',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.WORKSPACE_READ),
      ],
    },
    async (req, reply) => {
      try {
        const settings = await workspaceService.getWorkspaceSettings(req.workspaceId!);
        return reply.status(200).send({ settings });
      } catch (err: any) {
        req.log.error(err, 'Failed to get workspace settings');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: 'SETTINGS_ERROR',
          message: err.message || 'Failed to retrieve workspace settings',
        });
      }
    },
  );

  // PATCH /v1/workspaces/settings - Update retention and attendance policy
  app.patch(
    '/v1/workspaces/settings',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireWorkspace,
        authMiddleware.requirePermission(PERMISSIONS.WORKSPACE_MANAGE),
      ],
    },
    async (req, reply) => {
      const parsed = UpdateWorkspaceSettingsRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Invalid workspace settings payload',
          details: parsed.error.issues,
        });
      }

      try {
        const settings = await workspaceService.updateWorkspaceSettings(
          req.workspaceId!,
          req.user!.id,
          parsed.data,
        );

        return reply.status(200).send({
          settings,
          message: 'Workspace settings updated successfully',
        });
      } catch (err: any) {
        req.log.error(err, 'Failed to update workspace settings');
        const status = err.statusCode || 500;
        return reply.status(status).send({
          statusCode: status,
          error: 'UPDATE_SETTINGS_FAILED',
          message: err.message || 'Failed to update workspace settings',
        });
      }
    },
  );
};

