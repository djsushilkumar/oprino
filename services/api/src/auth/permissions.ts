/**
 * Canonical Phase 02A Permission Identifiers
 * Typed, granular permissions evaluated by Fastify authorization guards.
 */
export const PERMISSIONS = {
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_MANAGE: 'workspace.manage',
  MEMBERS_READ: 'members.read',
  MEMBERS_MANAGE: 'members.manage',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  DEVICES_READ: 'devices.read',
  DEVICES_MANAGE: 'devices.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface DefaultRoleTemplate {
  name: string;
  description: string;
  isSystemDefault: boolean;
  permissions: PermissionCode[];
}

export const DEFAULT_ROLE_TEMPLATES: Record<string, DefaultRoleTemplate> = {
  OWNER: {
    name: 'Owner/Admin',
    description: 'Full organization administrative and operational authority',
    isSystemDefault: true,
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.WORKSPACE_MANAGE,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.MEMBERS_MANAGE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.DEVICES_READ,
      PERMISSIONS.DEVICES_MANAGE,
    ],
  },
  MANAGER: {
    name: 'Manager',
    description: 'Operational team, branch, and device oversight',
    isSystemDefault: true,
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.DEVICES_READ,
      PERMISSIONS.DEVICES_MANAGE,
    ],
  },
  EMPLOYEE: {
    name: 'Employee',
    description: 'Frontline field and task execution scope',
    isSystemDefault: true,
    permissions: [PERMISSIONS.WORKSPACE_READ, PERMISSIONS.MEMBERS_READ],
  },
};
