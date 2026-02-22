import {
  hasRoleLevel,
  roleHasPermission,
  Permission,
  canAccessOrganization,
  getPermissionsForRole,
} from '@mmulpuri/auth';
import { RoleType } from '@mmulpuri/data';

describe('RBAC Lib', () => {
  // ─── hasRoleLevel ────────────────────────────────────────────────────────────
  describe('hasRoleLevel', () => {
    it('should allow OWNER to meet OWNER requirement', () => {
      expect(hasRoleLevel(RoleType.OWNER, RoleType.OWNER)).toBe(true);
    });

    it('should allow OWNER to meet ADMIN requirement', () => {
      expect(hasRoleLevel(RoleType.OWNER, RoleType.ADMIN)).toBe(true);
    });

    it('should allow OWNER to meet VIEWER requirement', () => {
      expect(hasRoleLevel(RoleType.OWNER, RoleType.VIEWER)).toBe(true);
    });

    it('should allow ADMIN to meet ADMIN requirement', () => {
      expect(hasRoleLevel(RoleType.ADMIN, RoleType.ADMIN)).toBe(true);
    });

    it('should allow ADMIN to meet VIEWER requirement', () => {
      expect(hasRoleLevel(RoleType.ADMIN, RoleType.VIEWER)).toBe(true);
    });

    it('should deny ADMIN from meeting OWNER requirement', () => {
      expect(hasRoleLevel(RoleType.ADMIN, RoleType.OWNER)).toBe(false);
    });

    it('should deny VIEWER from meeting ADMIN requirement', () => {
      expect(hasRoleLevel(RoleType.VIEWER, RoleType.ADMIN)).toBe(false);
    });

    it('should deny VIEWER from meeting OWNER requirement', () => {
      expect(hasRoleLevel(RoleType.VIEWER, RoleType.OWNER)).toBe(false);
    });
  });

  // ─── roleHasPermission ───────────────────────────────────────────────────────
  describe('roleHasPermission', () => {
    it('OWNER should have all permissions', () => {
      expect(roleHasPermission(RoleType.OWNER, Permission.TASK_CREATE)).toBe(true);
      expect(roleHasPermission(RoleType.OWNER, Permission.AUDIT_READ)).toBe(true);
      expect(roleHasPermission(RoleType.OWNER, Permission.TASK_DELETE_ANY)).toBe(true);
      expect(roleHasPermission(RoleType.OWNER, Permission.ORG_MANAGE)).toBe(true);
    });

    it('ADMIN should have audit read permission', () => {
      expect(roleHasPermission(RoleType.ADMIN, Permission.AUDIT_READ)).toBe(true);
    });

    it('ADMIN should NOT have org manage permission', () => {
      expect(roleHasPermission(RoleType.ADMIN, Permission.ORG_MANAGE)).toBe(false);
    });

    it('VIEWER should only have basic task permissions', () => {
      expect(roleHasPermission(RoleType.VIEWER, Permission.TASK_CREATE)).toBe(true);
      expect(roleHasPermission(RoleType.VIEWER, Permission.TASK_READ)).toBe(true);
      expect(roleHasPermission(RoleType.VIEWER, Permission.TASK_UPDATE)).toBe(true);
      expect(roleHasPermission(RoleType.VIEWER, Permission.TASK_DELETE)).toBe(true);
    });

    it('VIEWER should NOT have elevated permissions', () => {
      expect(roleHasPermission(RoleType.VIEWER, Permission.TASK_READ_ALL)).toBe(false);
      expect(roleHasPermission(RoleType.VIEWER, Permission.AUDIT_READ)).toBe(false);
      expect(roleHasPermission(RoleType.VIEWER, Permission.TASK_UPDATE_ANY)).toBe(false);
    });
  });

  // ─── getPermissionsForRole ───────────────────────────────────────────────────
  describe('getPermissionsForRole', () => {
    it('OWNER should have more permissions than ADMIN', () => {
      const ownerPerms = getPermissionsForRole(RoleType.OWNER);
      const adminPerms = getPermissionsForRole(RoleType.ADMIN);
      expect(ownerPerms.length).toBeGreaterThan(adminPerms.length);
    });

    it('ADMIN should have more permissions than VIEWER', () => {
      const adminPerms = getPermissionsForRole(RoleType.ADMIN);
      const viewerPerms = getPermissionsForRole(RoleType.VIEWER);
      expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });

  // ─── canAccessOrganization ───────────────────────────────────────────────────
  describe('canAccessOrganization', () => {
    const orgHierarchy = [
      { id: 'parent-1', parentId: undefined },
      { id: 'child-1', parentId: 'parent-1' },
      { id: 'child-2', parentId: 'parent-1' },
      { id: 'grandchild-1', parentId: 'child-1' },
      { id: 'unrelated-1', parentId: undefined },
    ];

    it('should allow access to own org for any role', () => {
      expect(canAccessOrganization(RoleType.VIEWER, 'parent-1', 'parent-1', orgHierarchy)).toBe(true);
    });

    it('ADMIN should access child org', () => {
      expect(canAccessOrganization(RoleType.ADMIN, 'parent-1', 'child-1', orgHierarchy)).toBe(true);
    });

    it('ADMIN should access grandchild org', () => {
      expect(canAccessOrganization(RoleType.ADMIN, 'parent-1', 'grandchild-1', orgHierarchy)).toBe(true);
    });

    it('VIEWER should NOT access child org', () => {
      expect(canAccessOrganization(RoleType.VIEWER, 'parent-1', 'child-1', orgHierarchy)).toBe(false);
    });

    it('ADMIN should NOT access unrelated org', () => {
      expect(canAccessOrganization(RoleType.ADMIN, 'parent-1', 'unrelated-1', orgHierarchy)).toBe(false);
    });

    it('OWNER should access child org', () => {
      expect(canAccessOrganization(RoleType.OWNER, 'parent-1', 'child-2', orgHierarchy)).toBe(true);
    });
  });
});
