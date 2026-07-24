import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
  entityType: string;
  entityId: string;
  action: string;
  prevValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId?: string;
  orgId?: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action,
        prevValues: dto.prevValues as Prisma.InputJsonValue | undefined,
        newValues: dto.newValues as Prisma.InputJsonValue | undefined,
        userId: dto.userId,
        orgId: dto.orgId,
        userRole: dto.userRole,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        reason: dto.reason,
      },
    });
  }

  async findAll(page = 1, limit = 50, entityType?: string, userId?: string) {
    page = Math.max(1, Math.trunc(page) || 1);
    limit = Math.min(100, Math.max(1, Math.trunc(limit) || 50));
    const where = {
      ...(entityType ? { entityType } : {}),
      ...(userId ? { userId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
