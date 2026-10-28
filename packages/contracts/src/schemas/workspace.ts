import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CreateWorkspaceRequestSchema = z
  .object({
    name: z.string().min(2).max(255).openapi({ example: 'Acme Field Services' }),
    slug: z.string().min(2).max(100).optional().openapi({ example: 'acme-field-services' }),
  })
  .openapi('CreateWorkspaceRequest');

export const WorkspaceResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Acme Field Services' }),
    slug: z.string().openapi({ example: 'acme-field-services' }),
    status: z.string().openapi({ example: 'ACTIVE' }),
    role: z.string().openapi({ example: 'Owner/Admin' }),
    permissions: z.array(z.string()).openapi({
      example: ['workspace.read', 'workspace.manage', 'members.read', 'members.manage'],
    }),
    createdAt: z.string().openapi({ example: '2026-10-05T12:00:00.000Z' }),
  })
  .openapi('WorkspaceResponse');

export const WorkspaceListItemSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Acme Field Services' }),
    slug: z.string().openapi({ example: 'acme-field-services' }),
    status: z.string().openapi({ example: 'ACTIVE' }),
    membershipStatus: z.string().openapi({ example: 'active' }),
    roleName: z.string().openapi({ example: 'Owner/Admin' }),
  })
  .openapi('WorkspaceListItem');

export const ListWorkspacesResponseSchema = z
  .object({
    workspaces: z.array(WorkspaceListItemSchema),
  })
  .openapi('ListWorkspacesResponse');

export const SwitchWorkspaceRequestSchema = z
  .object({
    workspaceId: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
  })
  .openapi('SwitchWorkspaceRequest');

export const SwitchWorkspaceResponseSchema = z
  .object({
    activeWorkspaceId: z
      .string()
      .uuid()
      .openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Acme Field Services' }),
    role: z.string().openapi({ example: 'Owner/Admin' }),
    permissions: z.array(z.string()).openapi({ example: ['workspace.read', 'workspace.manage'] }),
  })
  .openapi('SwitchWorkspaceResponse');

export const AddWorkspaceMemberRequestSchema = z
  .object({
    name: z.string().min(2).max(255).openapi({ example: 'Ramesh Kumar' }),
    email: z.string().email().openapi({ example: 'ramesh@oprino.com' }),
    password: z.string().min(8).optional().openapi({ example: 'Password123!' }),
    roleName: z.enum(['Employee', 'Manager']).default('Employee').openapi({ example: 'Employee' }),
  })
  .openapi('AddWorkspaceMemberRequest');

export const WorkspaceMemberSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Ramesh Kumar' }),
    email: z.string().email().openapi({ example: 'ramesh@oprino.com' }),
    image: z.string().nullable().optional(),
    membershipId: z.string().uuid().openapi({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    roleId: z.string().uuid().openapi({ example: 'r1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    roleName: z.string().openapi({ example: 'Employee' }),
    status: z.string().openapi({ example: 'active' }),
    managerId: z.string().uuid().nullable().optional(),
  })
  .openapi('WorkspaceMember');

export const AddWorkspaceMemberResponseSchema = z
  .object({
    member: WorkspaceMemberSchema,
    message: z.string().openapi({ example: 'Member added successfully' }),
  })
  .openapi('AddWorkspaceMemberResponse');

export const ListWorkspaceMembersResponseSchema = z
  .object({
    members: z.array(WorkspaceMemberSchema),
  })
  .openapi('ListWorkspaceMembersResponse');

// BLK-002: Secure Employee Invitations
export const InviteWorkspaceMemberRequestSchema = z
  .object({
    name: z.string().min(2).max(255).optional().openapi({ example: 'Ramesh Kumar' }),
    email: z.string().email().openapi({ example: 'ramesh@oprino.com' }),
    roleName: z.enum(['Employee', 'Manager']).default('Employee').openapi({ example: 'Employee' }),
  })
  .openapi('InviteWorkspaceMemberRequest');

export const WorkspaceInvitationSchema = z
  .object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable().optional(),
    roleName: z.string(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED']),
    expiresAt: z.string(),
    createdAt: z.string(),
    invitationUrl: z.string().optional(),
  })
  .openapi('WorkspaceInvitation');

export const InviteWorkspaceMemberResponseSchema = z
  .object({
    invitation: WorkspaceInvitationSchema,
    message: z.string(),
  })
  .openapi('InviteWorkspaceMemberResponse');

export const ListWorkspaceInvitationsResponseSchema = z
  .object({
    invitations: z.array(WorkspaceInvitationSchema),
  })
  .openapi('ListWorkspaceInvitationsResponse');

export const RevokeInvitationRequestSchema = z
  .object({
    invitationId: z.string().uuid(),
  })
  .openapi('RevokeInvitationRequest');

export const AcceptInvitationRequestSchema = z
  .object({
    token: z.string().min(16),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(255).optional(),
  })
  .openapi('AcceptInvitationRequest');

export const ValidateInvitationResponseSchema = z
  .object({
    valid: z.boolean(),
    email: z.string().optional(),
    name: z.string().nullable().optional(),
    workspaceName: z.string().optional(),
    roleName: z.string().optional(),
    expiresAt: z.string().optional(),
    reason: z.string().optional(),
  })
  .openapi('ValidateInvitationResponse');

// BLK-003: Employee Bulk CSV Import
export const BulkImportRowSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().min(1),
    role: z.enum(['Employee', 'Manager']).default('Employee'),
  })
  .openapi('BulkImportRow');

export const BulkImportMembersRequestSchema = z
  .object({
    members: z.array(BulkImportRowSchema).min(1).max(100),
  })
  .openapi('BulkImportMembersRequest');

export const BulkImportRowResultSchema = z
  .object({
    row: z.number(),
    email: z.string(),
    name: z.string().optional(),
    status: z.enum(['INVITED', 'FAILED', 'SKIPPED']),
    error: z.string().optional(),
    invitationUrl: z.string().optional(),
  })
  .openapi('BulkImportRowResult');

export const BulkImportMembersResponseSchema = z
  .object({
    totalRows: z.number(),
    successCount: z.number(),
    failureCount: z.number(),
    results: z.array(BulkImportRowResultSchema),
  })
  .openapi('BulkImportMembersResponse');

// BLK-005: Employee Lifecycle Management
export const UpdateWorkspaceMemberRequestSchema = z
  .object({
    roleName: z.enum(['Owner/Admin', 'Manager', 'Employee']).optional(),
    status: z.enum(['active', 'suspended', 'removed']).optional(),
    managerId: z.string().uuid().nullable().optional(),
  })
  .openapi('UpdateWorkspaceMemberRequest');

export const UpdateWorkspaceMemberResponseSchema = z
  .object({
    member: WorkspaceMemberSchema,
    message: z.string(),
  })
  .openapi('UpdateWorkspaceMemberResponse');

// BLK-006 & BLK-004: Configurable Retention and Attendance Policy
export const WorkspaceSettingsSchema = z
  .object({
    locationRetentionDays: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(180)]),
    attendancePolicy: z.enum([
      'SIMPLE',
      'GPS_REQUIRED',
      'SELFIE_REQUIRED',
      'GPS_AND_SELFIE_REQUIRED',
      'GEOFENCE_REQUIRED',
    ]),
  })
  .openapi('WorkspaceSettings');

export const UpdateWorkspaceSettingsRequestSchema = z
  .object({
    locationRetentionDays: z
      .union([z.literal(7), z.literal(30), z.literal(90), z.literal(180)])
      .optional(),
    attendancePolicy: z
      .enum([
        'SIMPLE',
        'GPS_REQUIRED',
        'SELFIE_REQUIRED',
        'GPS_AND_SELFIE_REQUIRED',
        'GEOFENCE_REQUIRED',
      ])
      .optional(),
  })
  .openapi('UpdateWorkspaceSettingsRequest');

export const WorkspaceSettingsResponseSchema = z
  .object({
    settings: WorkspaceSettingsSchema,
    message: z.string().optional(),
  })
  .openapi('WorkspaceSettingsResponse');

export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;
export type WorkspaceResponse = z.infer<typeof WorkspaceResponseSchema>;
export type WorkspaceListItem = z.infer<typeof WorkspaceListItemSchema>;
export type ListWorkspacesResponse = z.infer<typeof ListWorkspacesResponseSchema>;
export type SwitchWorkspaceRequest = z.infer<typeof SwitchWorkspaceRequestSchema>;
export type SwitchWorkspaceResponse = z.infer<typeof SwitchWorkspaceResponseSchema>;
export type AddWorkspaceMemberRequest = z.infer<typeof AddWorkspaceMemberRequestSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
export type AddWorkspaceMemberResponse = z.infer<typeof AddWorkspaceMemberResponseSchema>;
export type ListWorkspaceMembersResponse = z.infer<typeof ListWorkspaceMembersResponseSchema>;
export type InviteWorkspaceMemberRequest = z.infer<typeof InviteWorkspaceMemberRequestSchema>;
export type WorkspaceInvitation = z.infer<typeof WorkspaceInvitationSchema>;
export type InviteWorkspaceMemberResponse = z.infer<typeof InviteWorkspaceMemberResponseSchema>;
export type ListWorkspaceInvitationsResponse = z.infer<
  typeof ListWorkspaceInvitationsResponseSchema
>;
export type RevokeInvitationRequest = z.infer<typeof RevokeInvitationRequestSchema>;
export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;
export type ValidateInvitationResponse = z.infer<typeof ValidateInvitationResponseSchema>;
export type BulkImportRow = z.infer<typeof BulkImportRowSchema>;
export type BulkImportMembersRequest = z.infer<typeof BulkImportMembersRequestSchema>;
export type BulkImportRowResult = z.infer<typeof BulkImportRowResultSchema>;
export type BulkImportMembersResponse = z.infer<typeof BulkImportMembersResponseSchema>;
export type UpdateWorkspaceMemberRequest = z.infer<typeof UpdateWorkspaceMemberRequestSchema>;
export type UpdateWorkspaceMemberResponse = z.infer<typeof UpdateWorkspaceMemberResponseSchema>;
export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;
export type UpdateWorkspaceSettingsRequest = z.infer<typeof UpdateWorkspaceSettingsRequestSchema>;
export type WorkspaceSettingsResponse = z.infer<typeof WorkspaceSettingsResponseSchema>;
