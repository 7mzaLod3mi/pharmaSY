import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgStatus, UserStatus } from '@pharmasyn/types';
import { AuditService } from '../audit/audit.service';

export interface CreateSupplierProfileDto {
  name: string;
  tradeRegister: string;
  address: string;
  city: string;
  phone: string;
  logoUrl?: string;
  tradeRegisterDocUrl?: string;
}

export interface UpdateSupplierProfileDto {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  logoUrl?: string;
}

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createProfile(userId: string, data: CreateSupplierProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { emailVerifiedAt: true },
    });
    if (!user?.emailVerifiedAt) {
      throw new BadRequestException(
        'Email must be verified before organization registration',
      );
    }

    const existing = await this.prisma.supplier.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        'Supplier profile already exists for this user',
      );
    }

    const registerExists = await this.prisma.supplier.findUnique({
      where: { tradeRegister: data.tradeRegister },
    });
    if (registerExists) {
      throw new ConflictException('Trade register number already in use');
    }

    const [supplier] = await this.prisma.$transaction([
      this.prisma.supplier.create({
        data: {
          userId,
          name: data.name,
          tradeRegister: data.tradeRegister,
          address: data.address,
          city: data.city,
          phone: data.phone,
          logoUrl: data.logoUrl,
          status: OrgStatus.PENDING,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.PENDING },
      }),
    ]);
    return supplier;
  }

  async getProfile(userId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { userId },
    });
    if (!supplier) throw new NotFoundException('Supplier profile not found');
    return supplier;
  }

  async getById(supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateProfile(userId: string, data: UpdateSupplierProfileDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { userId },
    });
    if (!supplier) throw new NotFoundException('Supplier profile not found');

    const updated = await this.prisma.supplier.update({
      where: { userId },
      data,
    });
    await this.audit.log({
      entityType: 'Supplier',
      entityId: supplier.id,
      action: 'UPDATE_PROFILE',
      prevValues: {
        name: supplier.name,
        address: supplier.address,
        city: supplier.city,
        phone: supplier.phone,
      },
      newValues: { ...data },
      userId,
      orgId: supplier.id,
      userRole: 'SUPPLIER',
    });
    return updated;
  }
}
