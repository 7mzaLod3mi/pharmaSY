import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgStatus, Prisma, UserRole, UserStatus } from '@prisma/client';

export type OrgType = 'pharmacy' | 'supplier';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats Overview ────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      pendingPharmacies,
      pendingSuppliers,
      totalPharmacies,
      totalSuppliers,
      totalOrders,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.pharmacy.count({ where: { status: OrgStatus.PENDING } }),
      this.prisma.supplier.count({ where: { status: OrgStatus.PENDING } }),
      this.prisma.pharmacy.count({ where: { status: OrgStatus.APPROVED } }),
      this.prisma.supplier.count({ where: { status: OrgStatus.APPROVED } }),
      this.prisma.order.count(),
    ]);

    return {
      totalUsers,
      pendingApprovals: pendingPharmacies + pendingSuppliers,
      pendingPharmacies,
      pendingSuppliers,
      totalPharmacies,
      totalSuppliers,
      totalOrders,
    };
  }

  // ─── Pending Approvals Queue ───────────────────────────────────────────────

  async getPendingPharmacies(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.pharmacy.findMany({
        where: { status: OrgStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // oldest first
      }),
      this.prisma.pharmacy.count({ where: { status: OrgStatus.PENDING } }),
    ]);
    return { data, total, page, limit };
  }

  async getPendingSuppliers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { status: OrgStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.supplier.count({ where: { status: OrgStatus.PENDING } }),
    ]);
    return { data, total, page, limit };
  }

  // ─── Approve / Reject ─────────────────────────────────────────────────────

  async approvePharmacy(pharmacyId: string, adminId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: { user: { select: { emailVerifiedAt: true } } },
    });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    if (pharmacy.status !== OrgStatus.PENDING) {
      throw new BadRequestException(`Pharmacy is already ${pharmacy.status}`);
    }
    if (!pharmacy.user.emailVerifiedAt) {
      throw new BadRequestException(
        'Pharmacy owner email must be verified first',
      );
    }

    const [updatedPharmacy] = await this.prisma.$transaction([
      this.prisma.pharmacy.update({
        where: { id: pharmacyId },
        data: {
          status: OrgStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: adminId,
          rejectedAt: null,
          rejectedBy: null,
          rejectionNote: null,
        },
      }),
      // Activate the user account
      this.prisma.user.update({
        where: { id: pharmacy.userId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.auditLog.create({
        data: {
          entityType: 'Pharmacy',
          entityId: pharmacyId,
          action: 'APPROVE',
          userId: adminId,
          userRole: 'ADMIN',
          newValues: { status: OrgStatus.APPROVED },
        },
      }),
    ]);

    return updatedPharmacy;
  }

  async rejectPharmacy(pharmacyId: string, adminId: string, reason: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    if (pharmacy.status !== OrgStatus.PENDING) {
      throw new BadRequestException(`Pharmacy is already ${pharmacy.status}`);
    }

    const [updatedPharmacy] = await this.prisma.$transaction([
      this.prisma.pharmacy.update({
        where: { id: pharmacyId },
        data: {
          status: OrgStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: adminId,
          rejectionNote: reason,
        },
      }),
      this.prisma.user.update({
        where: { id: pharmacy.userId },
        data: { status: UserStatus.PENDING },
      }),
      this.prisma.auditLog.create({
        data: {
          entityType: 'Pharmacy',
          entityId: pharmacyId,
          action: 'REJECT',
          userId: adminId,
          userRole: 'ADMIN',
          reason,
          newValues: { status: OrgStatus.REJECTED },
        },
      }),
    ]);

    return updatedPharmacy;
  }

  async approveSupplier(supplierId: string, adminId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      include: { user: { select: { emailVerifiedAt: true } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.status !== OrgStatus.PENDING) {
      throw new BadRequestException(`Supplier is already ${supplier.status}`);
    }
    if (!supplier.user.emailVerifiedAt) {
      throw new BadRequestException(
        'Supplier owner email must be verified first',
      );
    }

    const [updatedSupplier] = await this.prisma.$transaction([
      this.prisma.supplier.update({
        where: { id: supplierId },
        data: {
          status: OrgStatus.APPROVED,
          verifiedAt: new Date(),
          verifiedBy: adminId,
          rejectedAt: null,
          rejectedBy: null,
          rejectionNote: null,
        },
      }),
      this.prisma.user.update({
        where: { id: supplier.userId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.auditLog.create({
        data: {
          entityType: 'Supplier',
          entityId: supplierId,
          action: 'APPROVE',
          userId: adminId,
          userRole: 'ADMIN',
          newValues: { status: OrgStatus.APPROVED },
        },
      }),
    ]);

    return updatedSupplier;
  }

  async rejectSupplier(supplierId: string, adminId: string, reason: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier.status !== OrgStatus.PENDING) {
      throw new BadRequestException(`Supplier is already ${supplier.status}`);
    }

    const [updatedSupplier] = await this.prisma.$transaction([
      this.prisma.supplier.update({
        where: { id: supplierId },
        data: {
          status: OrgStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: adminId,
          rejectionNote: reason,
        },
      }),
      this.prisma.user.update({
        where: { id: supplier.userId },
        data: { status: UserStatus.PENDING },
      }),
      this.prisma.auditLog.create({
        data: {
          entityType: 'Supplier',
          entityId: supplierId,
          action: 'REJECT',
          userId: adminId,
          userRole: 'ADMIN',
          reason,
          newValues: { status: OrgStatus.REJECTED },
        },
      }),
    ]);

    return updatedSupplier;
  }

  // ─── All Users (for admin management) ─────────────────────────────────────

  async getAllUsers(page = 1, limit = 20, role?: string, status?: string) {
    page = Math.max(1, Math.trunc(page) || 1);
    limit = Math.min(100, Math.max(1, Math.trunc(limit) || 20));
    const skip = (page - 1) * limit;
    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('Invalid user role');
    }
    if (status && !Object.values(UserStatus).includes(status as UserStatus)) {
      throw new BadRequestException('Invalid user status');
    }
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role: role as UserRole } : {}),
      ...(status ? { status: status as UserStatus } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          pharmacy: {
            select: { id: true, name: true, status: true, city: true },
          },
          supplier: {
            select: { id: true, name: true, status: true, city: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async suspendUser(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new BadRequestException(
        'Administrators cannot suspend their own account',
      );
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.SUSPENDED },
      });
      await tx.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
      await tx.auditLog.create({
        data: {
          entityType: 'User',
          entityId: userId,
          action: 'SUSPEND',
          userId: adminId,
          userRole: UserRole.ADMIN,
          newValues: {
            previousStatus: user.status,
            status: UserStatus.SUSPENDED,
          },
        },
      });
      return updated;
    });
  }

  async activateUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        pharmacy: { select: { status: true } },
        supplier: { select: { status: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.emailVerifiedAt) {
      throw new BadRequestException(
        'Email must be verified before account activation',
      );
    }

    const organization =
      user.role === UserRole.PHARMACY ? user.pharmacy : user.supplier;
    if (
      user.role !== UserRole.ADMIN &&
      organization?.status !== OrgStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Organization must be approved before account activation',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
      });
      await tx.auditLog.create({
        data: {
          entityType: 'User',
          entityId: userId,
          action: 'ACTIVATE',
          userId: adminId,
          userRole: UserRole.ADMIN,
          newValues: {
            previousStatus: user.status,
            status: UserStatus.ACTIVE,
          },
        },
      });
      return updated;
    });
  }
}
