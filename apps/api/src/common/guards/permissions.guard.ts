import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@pharmasyn/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { roleHasPermissions } from '../permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    const user = request.user;
    if (!user?.role || !roleHasPermissions(user.role, required)) {
      throw new ForbiddenException('Missing required permission');
    }

    return true;
  }
}
