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

export type CreateWorkspaceRequest = z.infer<typeof CreateWorkspaceRequestSchema>;
export type WorkspaceResponse = z.infer<typeof WorkspaceResponseSchema>;
export type WorkspaceListItem = z.infer<typeof WorkspaceListItemSchema>;
export type ListWorkspacesResponse = z.infer<typeof ListWorkspacesResponseSchema>;
export type SwitchWorkspaceRequest = z.infer<typeof SwitchWorkspaceRequestSchema>;
export type SwitchWorkspaceResponse = z.infer<typeof SwitchWorkspaceResponseSchema>;
