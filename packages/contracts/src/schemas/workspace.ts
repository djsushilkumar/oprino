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
    password: z.string().min(8).openapi({ example: 'Password123!' }),
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
