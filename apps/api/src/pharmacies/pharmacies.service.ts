import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgStatus, UserStatus } from '@pharmasyn/types';

export interface CreatePharmacyProfileDto {
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  phone: string;
  logoUrl?: string;
  licenseDocUrl?: string;
}

export interface UpdatePharmacyProfileDto {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  logoUrl?: string;
}

@Injectable()
export class PharmaciesService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, data: CreatePharmacyProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { emailVerifiedAt: true },
    });
    if (!user?.emailVerifiedAt) {
      throw new BadRequestException('Email must be verified before organization registration');
    }

    const existing = await this.prisma.pharmacy.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Pharmacy profile already exists for this user');
    }

    const licenseExists = await this.prisma.pharmacy.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (licenseExists) {
      throw new ConflictException('License number already registered');
    }

    const [pharmacy] = await this.prisma.$transaction([
      this.prisma.pharmacy.create({
        data: {
          userId,
          name: data.name,
          licenseNumber: data.licenseNumber,
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
    return pharmacy;
  }

  async getProfile(userId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { userId } });
    if (!pharmacy) throw new NotFoundException('Pharmacy profile not found');
    return pharmacy;
  }

  async getById(pharmacyId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    return pharmacy;
  }

  async updateProfile(userId: string, data: UpdatePharmacyProfileDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { userId } });
    if (!pharmacy) throw new NotFoundException('Pharmacy profile not found');

    return this.prisma.pharmacy.update({
      where: { userId },
      data,
    });
  }
}
