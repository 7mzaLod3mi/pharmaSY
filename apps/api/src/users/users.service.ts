import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountVerificationState,
  OrgStatus,
  UserRole,
  UserStatus,
} from '@pharmasyn/types';
import { resolveAccountVerificationState } from '../auth/account-state';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        pharmacy: {
          select: {
            id: true,
            name: true,
            status: true,
            rejectionNote: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            status: true,
            rejectionNote: true,
          },
        },
      },
    });

    if (!user) return null;

    const role = user.role as UserRole;
    const status = user.status as UserStatus;
    const organization =
      role === UserRole.PHARMACY ? user.pharmacy : user.supplier;
    const accountState = resolveAccountVerificationState({
      role,
      status,
      emailVerifiedAt: user.emailVerifiedAt,
      organization: organization
        ? { status: organization.status as OrgStatus }
        : null,
    });

    return {
      ...user,
      orgId: organization?.id,
      orgName: organization?.name,
      orgStatus: organization?.status,
      accountState,
      organizationRejectionReason: organization?.rejectionNote ?? undefined,
      requiresOrganizationApproval:
        role !== UserRole.ADMIN &&
        accountState !== AccountVerificationState.ACTIVE,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }
}
