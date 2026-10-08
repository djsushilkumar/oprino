/**
 * Canonical Phase 02A & Phase 02B Permission Identifiers
 * Typed, granular permissions evaluated by Fastify authorization guards.
 */
export const PERMISSIONS = {
  // Phase 02A: Tenancy & Governance
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_MANAGE: 'workspace.manage',
  MEMBERS_READ: 'members.read',
  MEMBERS_MANAGE: 'members.manage',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  DEVICES_READ: 'devices.read',
  DEVICES_MANAGE: 'devices.manage',

  // Phase 02B: Tasks Domain
  TASKS_READ: 'tasks.read',
  TASKS_CREATE: 'tasks.create',
  TASKS_ASSIGN: 'tasks.assign',
  TASKS_UPDATE: 'tasks.update',
  TASKS_COMPLETE: 'tasks.complete',
  TASKS_VERIFY: 'tasks.verify',

  // Phase 02B: Attendance Domain
  ATTENDANCE_SELF_READ: 'attendance.self.read',
  ATTENDANCE_SELF_PUNCH: 'attendance.self.punch',
  ATTENDANCE_TEAM_READ: 'attendance.team.read',
  ATTENDANCE_MANAGE: 'attendance.manage',
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
      // Tasks
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.TASKS_CREATE,
      PERMISSIONS.TASKS_ASSIGN,
      PERMISSIONS.TASKS_UPDATE,
      PERMISSIONS.TASKS_COMPLETE,
      PERMISSIONS.TASKS_VERIFY,
      // Attendance
      PERMISSIONS.ATTENDANCE_SELF_READ,
      PERMISSIONS.ATTENDANCE_SELF_PUNCH,
      PERMISSIONS.ATTENDANCE_TEAM_READ,
      PERMISSIONS.ATTENDANCE_MANAGE,
    ],
  },
  MANAGER: {
    name: 'Manager',
    description: 'Operational team, branch, task management, and attendance oversight',
    isSystemDefault: true,
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_READ,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.DEVICES_READ,
      PERMISSIONS.DEVICES_MANAGE,
      // Tasks
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.TASKS_CREATE,
      PERMISSIONS.TASKS_ASSIGN,
      PERMISSIONS.TASKS_UPDATE,
      PERMISSIONS.TASKS_COMPLETE,
      PERMISSIONS.TASKS_VERIFY,
      // Attendance
      PERMISSIONS.ATTENDANCE_SELF_READ,
      PERMISSIONS.ATTENDANCE_SELF_PUNCH,
      PERMISSIONS.ATTENDANCE_TEAM_READ,
      PERMISSIONS.ATTENDANCE_MANAGE,
    ],
  },
  EMPLOYEE: {
    name: 'Employee',
    description: 'Frontline field execution, personal tasks, and self attendance scope',
    isSystemDefault: true,
    permissions: [
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.MEMBERS_READ,
      // Tasks
      PERMISSIONS.TASKS_READ,
      PERMISSIONS.TASKS_UPDATE,
      PERMISSIONS.TASKS_COMPLETE,
      // Attendance
      PERMISSIONS.ATTENDANCE_SELF_READ,
      PERMISSIONS.ATTENDANCE_SELF_PUNCH,
    ],
  },
};
