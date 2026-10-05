import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { AuthUserSchema } from './auth.js';

extendZodWithOpenApi(z);

export const ActiveWorkspaceInfoSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Acme Field Services' }),
    slug: z.string().openapi({ example: 'acme-field-services' }),
    status: z.string().openapi({ example: 'ACTIVE' }),
  })
  .openapi('ActiveWorkspaceInfo');

export const MembershipInfoSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'm1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    status: z.string().openapi({ example: 'active' }),
  })
  .openapi('MembershipInfo');

export const RoleInfoSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'r1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    name: z.string().openapi({ example: 'Owner/Admin' }),
  })
  .openapi('RoleInfo');

export const InstallationInfoSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    installationId: z.string().uuid().openapi({ example: 'i1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    status: z.string().openapi({ example: 'active' }),
    isTrusted: z.boolean().openapi({ example: true }),
  })
  .openapi('InstallationInfo');

export const MeResponseSchema = z
  .object({
    user: AuthUserSchema,
    activeWorkspace: ActiveWorkspaceInfoSchema.nullable().optional(),
    membership: MembershipInfoSchema.nullable().optional(),
    role: RoleInfoSchema.nullable().optional(),
    permissions: z.array(z.string()).openapi({ example: ['workspace.read', 'workspace.manage'] }),
    currentInstallation: InstallationInfoSchema.nullable().optional(),
  })
  .openapi('MeResponse');

export type ActiveWorkspaceInfo = z.infer<typeof ActiveWorkspaceInfoSchema>;
export type MembershipInfo = z.infer<typeof MembershipInfoSchema>;
export type RoleInfo = z.infer<typeof RoleInfoSchema>;
export type InstallationInfo = z.infer<typeof InstallationInfoSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
