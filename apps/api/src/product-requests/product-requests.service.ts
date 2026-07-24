import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestStatus, ProductStatus } from '@pharmasyn/types';

export interface CreateProductRequestDto {
  brandName: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  barcode?: string;
  imageUrl?: string;
  notes?: string;
}

@Injectable()
export class ProductRequestsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  async create(dto: CreateProductRequestDto, requesterId: string) {
    return this.prisma.productRequest.create({
      data: {
        ...dto,
        requesterId,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return this.prisma.productRequest.findMany({
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, role: true } },
        resolvedProduct: { select: { id: true, tradeNameAr: true, tradeNameEn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const req = await this.prisma.productRequest.findUnique({
      where: { id },
      include: { requester: true }
    });
    if (!req) throw new NotFoundException('Product request not found');
    return req;
  }

  async findSimilar(id: string) {
    const req = await this.findById(id);
    
    // Very basic similarity search: match barcode or partial brand/generic names
    const orConditions: any[] = [];
    if (req.barcode) orConditions.push({ barcode: req.barcode });
    if (req.brandName) {
      orConditions.push({ tradeNameAr: { contains: req.brandName, mode: 'insensitive' } });
      orConditions.push({ tradeNameEn: { contains: req.brandName, mode: 'insensitive' } });
    }
    if (req.genericName) {
      orConditions.push({ scientificName: { contains: req.genericName, mode: 'insensitive' } });
    }

    if (orConditions.length === 0) return [];

    return this.prisma.product.findMany({
      where: {
        OR: orConditions,
        deletedAt: null,
      },
      take: 10,
    });
  }

  async approve(id: string, adminId: string, categoryId: string) {
    const req = await this.findById(id);
    if (req.status !== 'PENDING') throw new BadRequestException('Request is not pending');

    // Create the master product
    // Note: We need a categoryId because it's required for Product.
    // The admin approving must supply it, or we find a generic one.
    
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tradeNameAr: req.brandName,
          tradeNameEn: req.brandName,
          scientificName: req.genericName,
          dosageForm: req.dosageForm,
          strength: req.strength,
          packageSize: req.packageSize,
          barcode: req.barcode,
          imageUrl: req.imageUrl,
          categoryId: categoryId, // Required from Admin
          unit: 'box', // Defaulting for now
          status: 'ACTIVE',
          version: 1,
          createdBy: adminId,
          updatedBy: adminId,
        }
      });

      const updatedReq = await tx.productRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          resolvedProductId: product.id,
        },
      });

      return { product, request: updatedReq };
    });
    
    await this.audit.log({
      entityType: 'ProductRequest',
      entityId: id,
      action: 'APPROVE_PRODUCT_REQUEST',
      userId: adminId,
      userRole: 'ADMIN'
    });
    
    return result;
  }

  async reject(id: string, reason: string) {
    const req = await this.findById(id);
    if (req.status !== 'PENDING') throw new BadRequestException('Request is not pending');

    return this.prisma.productRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }

  async merge(id: string, productId: string) {
    const req = await this.findById(id);
    if (req.status !== 'PENDING') throw new BadRequestException('Request is not pending');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Master product not found to merge into');

    return this.prisma.productRequest.update({
      where: { id },
      data: {
        status: 'MERGED',
        resolvedProductId: productId,
      },
    });
  }
}
