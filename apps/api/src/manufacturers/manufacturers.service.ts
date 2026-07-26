import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateManufacturerDto {
  name: string;
  country?: string;
  logoUrl?: string;
}

export interface UpdateManufacturerDto {
  name?: string;
  country?: string;
  logoUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class ManufacturersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, includeInactive = false) {
    return this.prisma.manufacturer.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const m = await this.prisma.manufacturer.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!m) throw new NotFoundException('Manufacturer not found');
    return m;
  }

  async create(dto: CreateManufacturerDto) {
    return this.prisma.manufacturer.create({ data: dto });
  }

  async update(id: string, dto: UpdateManufacturerDto) {
    await this.findById(id);
    return this.prisma.manufacturer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const m = await this.findById(id);
    if (m._count.products > 0) {
      // Soft-deactivate instead of hard delete
      return this.prisma.manufacturer.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.manufacturer.delete({ where: { id } });
  }
}
