import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MovementType, ReportType } from '@prisma/client';
import { UserRole } from '@pharmasyn/types';
import { ReportsService } from './reports.service';

describe('ReportsService access and isolation', () => {
  const prisma = {
    sale: { findMany: jest.fn() },
    inventoryMovement: { findMany: jest.fn() },
  };
  const service = new ReportsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.sale.findMany.mockResolvedValue([]);
    prisma.inventoryMovement.findMany.mockResolvedValue([]);
  });

  it('exposes only the report catalog allowed for the organization role', () => {
    const pharmacy = service.catalog(UserRole.PHARMACY).map((item) => item.reportType);
    const supplier = service.catalog(UserRole.SUPPLIER).map((item) => item.reportType);

    expect(pharmacy).toContain(ReportType.PHARMACY_POS_SALES);
    expect(pharmacy).not.toContain(ReportType.SUPPLIER_SALES);
    expect(supplier).toContain(ReportType.SUPPLIER_SALES);
    expect(supplier).not.toContain(ReportType.INVENTORY_VALUE);
    expect(service.catalog(UserRole.ADMIN)).toEqual([]);
  });

  it('never accepts a pharmacy report for a supplier or without an organization', () => {
    expect(() =>
      service.assertAccess(
        ReportType.PHARMACY_POS_SALES,
        UserRole.SUPPLIER,
        'supplier-1',
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      service.assertAccess(
        ReportType.PHARMACY_POS_SALES,
        UserRole.PHARMACY,
      ),
    ).toThrow(ForbiddenException);
  });

  it('derives the POS sales query scope from the authenticated pharmacy', async () => {
    await service.generate(
      ReportType.PHARMACY_POS_SALES,
      { role: UserRole.PHARMACY, orgId: 'pharmacy-a' },
      {},
    );

    expect(prisma.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ pharmacyId: 'pharmacy-a' }),
      }),
    );
  });

  it('validates date ranges and movement enum filters before querying', async () => {
    await expect(
      service.generate(
        ReportType.PHARMACY_POS_SALES,
        { role: UserRole.PHARMACY, orgId: 'pharmacy-a' },
        { from: '2026-07-25', to: '2026-07-24' },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.generate(
        ReportType.INVENTORY_MOVEMENTS,
        { role: UserRole.PHARMACY, orgId: 'pharmacy-a' },
        { status: 'NOT_A_MOVEMENT' },
      ),
    ).rejects.toThrow('Invalid inventory movement type');
    expect(prisma.inventoryMovement.findMany).not.toHaveBeenCalled();
  });

  it('passes a validated movement type into the tenant-scoped query', async () => {
    await service.generate(
      ReportType.INVENTORY_MOVEMENTS,
      { role: UserRole.PHARMACY, orgId: 'pharmacy-a' },
      { status: MovementType.POS_SALE },
    );

    expect(prisma.inventoryMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pharmacyId: 'pharmacy-a',
          type: MovementType.POS_SALE,
        }),
      }),
    );
  });
});
