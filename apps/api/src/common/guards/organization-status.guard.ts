import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgStatus, UserRole, UserStatus } from '@pharmasyn/types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  ALLOW_PENDING_ORGANIZATION_KEY,
} from '../decorators/allow-pending-organization.decorator';

interface AuthenticatedRequestUser {
  role: UserRole;
  status?: UserStatus;
  orgId?: string;
  orgStatus?: OrgStatus;
}

@Injectable()
export class OrganizationStatusGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedRequestUser | undefined;
    if (!user) return true;

    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_ORGANIZATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (user.role === UserRole.ADMIN) {
      if (user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Administrator account is not active');
      }
      return true;
    }

    // These routes expose only onboarding/status operations. JwtStrategy has
    // already rejected deleted, suspended, and banned users. Do not couple
    // their availability to a manually mutable PENDING/ACTIVE flag.
    if (allowPending) {
      return true;
    }

    if (
      user.status !== UserStatus.ACTIVE ||
      !user.orgId ||
      user.orgStatus !== OrgStatus.APPROVED
    ) {
      throw new ForbiddenException('Organization approval is required');
    }

    return true;
  }
}
