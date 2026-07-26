import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, mergeMap } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import type { JwtPayload } from '@pharmasyn/types';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'otp',
]);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    if (!MUTATING_METHODS.has(request.method)) return next.handle();

    return next.handle().pipe(
      mergeMap(async (data) => {
        try {
          const user = request.user;
          const entityId =
            request.params?.id ||
            this.extractIdentifier(data) ||
            request.originalUrl;
          await this.auditService.log({
            entityType: this.entityTypeFromPath(request.path),
            entityId: String(entityId),
            action: request.method,
            userId: user?.sub,
            orgId: user?.orgId,
            userRole: user?.role || 'ANONYMOUS',
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            newValues: this.sanitize(request.body),
          });
        } catch (error) {
          this.logger.error('Automatic audit logging failed', error);
        }
        return data;
      }),
    );
  }

  private entityTypeFromPath(path: string) {
    const segment = path
      .split('/')
      .filter(Boolean)
      .find((part) => part !== 'api' && part !== 'v1');
    return segment || 'Unknown';
  }

  private extractIdentifier(data: unknown): string | undefined {
    if (!data || typeof data !== 'object') return undefined;
    const record = data as Record<string, unknown>;
    if (typeof record.id === 'string') return record.id;
    if (record.data && typeof record.data === 'object') {
      const nestedId = (record.data as Record<string, unknown>).id;
      if (typeof nestedId === 'string') return nestedId;
    }
    return undefined;
  }

  private sanitize(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const result: Record<string, unknown> = {};
    for (const [key, fieldValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : fieldValue;
    }
    return result;
  }
}
