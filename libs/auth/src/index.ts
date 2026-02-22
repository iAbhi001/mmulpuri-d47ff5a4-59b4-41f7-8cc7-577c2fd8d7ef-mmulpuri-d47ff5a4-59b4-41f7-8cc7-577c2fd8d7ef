import { RoleType } from '@mmulpuri/data';

// ─── Role Hierarchy ───────────────────────────────────────────────────────────
// Owner > Admin > Viewer
// Each role inherits permissions of roles below it.

const ROLE_HIERARCHY: Record<RoleType, number> = {
  [RoleType.OWNER]: 3,
  [RoleType.ADMIN]: 2,
  [RoleType.VIEWER]: 1,
};

/**
 * Returns true if `userRole` meets or exceeds `requiredRole` in the hierarchy.
 */
export function hasRoleLevel(userRole: RoleType, requiredRole: RoleType): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─── Permission Definitions ───────────────────────────────────────────────────

export enum Permission {
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_READ_ALL = 'task:read:all',       // all tasks in org
  TASK_UPDATE_ANY = 'task:update:any',   // any task in org
  TASK_DELETE_ANY = 'task:delete:any',   // any task in org

  // Audit log permissions
  AUDIT_READ = 'audit:read',

  // User management
  USER_MANAGE = 'user:manage',

  // Organization management
  ORG_MANAGE = 'org:manage',
}

const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  [RoleType.OWNER]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_READ_ALL,
    Permission.TASK_UPDATE_ANY,
    Permission.TASK_DELETE_ANY,
    Permission.AUDIT_READ,
    Permission.USER_MANAGE,
    Permission.ORG_MANAGE,
  ],
  [RoleType.ADMIN]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_READ_ALL,
    Permission.TASK_UPDATE_ANY,
    Permission.TASK_DELETE_ANY,
    Permission.AUDIT_READ,
    Permission.USER_MANAGE,
  ],
  [RoleType.VIEWER]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
  ],
};

/**
 * Returns all permissions for a given role (with inheritance applied).
 */
export function getPermissionsForRole(role: RoleType): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Returns true if the given role has the specified permission.
 */
export function roleHasPermission(role: RoleType, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/**
 * Returns true if a user (by role + orgId) can access a resource scoped to orgId.
 * Owners and Admins can see all tasks in their org AND child orgs.
 * Viewers can only see their own tasks.
 */
export function canAccessOrganization(
  userRole: RoleType,
  userOrgId: string,
  resourceOrgId: string,
  orgHierarchy: { id: string; parentId?: string }[]
): boolean {
  if (userOrgId === resourceOrgId) return true;

  // Owners and admins can access child organizations
  if (hasRoleLevel(userRole, RoleType.ADMIN)) {
    return isChildOrg(userOrgId, resourceOrgId, orgHierarchy);
  }

  return false;
}

/**
 * Check if `childOrgId` is a child of `parentOrgId` in the hierarchy.
 */
export function isChildOrg(
  parentOrgId: string,
  childOrgId: string,
  orgHierarchy: { id: string; parentId?: string }[]
): boolean {
  const child = orgHierarchy.find((o) => o.id === childOrgId);
  if (!child) return false;
  if (child.parentId === parentOrgId) return true;
  if (child.parentId) {
    return isChildOrg(parentOrgId, child.parentId, orgHierarchy);
  }
  return false;
}

export { RoleType, ROLE_HIERARCHY, ROLE_PERMISSIONS };
