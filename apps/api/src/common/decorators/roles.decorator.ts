import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@mmulpuri/data';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles are allowed to access a route.
 * Uses role hierarchy — specifying ADMIN also allows OWNER.
 *
 * @example
 * @Roles(RoleType.ADMIN) // allows ADMIN and OWNER
 * @Roles(RoleType.VIEWER) // allows all roles
 */
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
