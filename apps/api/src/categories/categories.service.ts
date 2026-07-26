import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCategoryDto {
  nameAr: string;
  nameEn: string;
  slug: string;
  parentId?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  parentId?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    // Return only root categories (no parent) - children are nested
    return categories.filter((c: { parentId: string | null }) => !c.parentId);
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slugExists = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (slugExists) throw new ConflictException('Slug already in use');

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new BadRequestException('Parent category not found');
    }

    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    if (dto.slug) {
      const slugExists = await this.prisma.category.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (slugExists) throw new ConflictException('Slug already in use');
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const category = await this.findById(id);
    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated products',
      );
    }
    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories',
      );
    }
    return this.prisma.category.delete({ where: { id } });
  }
}
