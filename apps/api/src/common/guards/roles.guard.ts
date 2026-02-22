import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@mmulpuri/data';
import { hasRoleLevel } from '@mmulpuri/auth';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@mmulpuri/data';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator means route is accessible to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user's role satisfies ANY of the required roles (with inheritance)
    const hasPermission = requiredRoles.some((requiredRole) =>
      hasRoleLevel(user.role, requiredRole)
    );

    if (!hasPermission) {
      await this.auditService.log({
        userId: user.id,
        action: AuditAction.ACCESS_DENIED,
        resource: context.getClass().name,
        details: `Role ${user.role} attempted to access route requiring ${requiredRoles.join(', ')}`,
        ipAddress: request.ip,
        success: false,
      });
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`
      );
    }

    return true;
  }
}
