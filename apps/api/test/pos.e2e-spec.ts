import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UploadService } from '../src/upload/upload.service';
import request, { type Response as SupertestResponse } from 'supertest';
import * as bcrypt from 'bcrypt';

jest.setTimeout(30000);

function assertDedicatedTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('E2E tests require NODE_ENV=test');
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('E2E tests require DATABASE_URL');
  const parsed = new URL(databaseUrl);
  const target = `${parsed.pathname}/${parsed.searchParams.get('schema') ?? ''}`;
  if (!/test/i.test(target)) {
    throw new Error(
      'Refusing destructive E2E cleanup: database name or schema must contain "test"',
    );
  }
}

describe('Pharmacy POS workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let pharmacyToken: string;
  let otherPharmacyToken: string;
  let pharmacyUserId: string;
  let pharmacyId: string;
  let otherPharmacyId: string;
  let productId: string;
  let concurrentProductId: string;
  let earlyBatchId: string;
  let lateBatchId: string;
  let saleId: string;
  let saleItemId: string;
  const uploadedExports: Array<{
    key: string;
    contentType: string;
    fileName: string;
    size: number;
  }> = [];

  const saleMutationId = randomUUID();
  const salePayload = {
    items: [
      {
        productId: '',
        quantity: 4,
        unitPrice: 100,
        lineDiscountAmount: 20,
      },
    ],
    discount: { type: 'PERCENTAGE', value: 10 },
    payments: [{ method: 'CASH', amount: 350 }],
    customerName: 'Walk-in patient',
    clientMutationId: saleMutationId,
    deviceId: 'pos-e2e-terminal',
  };

  beforeAll(async () => {
    assertDedicatedTestDatabase();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UploadService)
      .useValue({
        uploadPrivateBuffer: jest.fn(
          (
            buffer: Buffer,
            key: string,
            contentType: string,
            fileName: string,
          ) => {
            uploadedExports.push({
              key,
              contentType,
              fileName,
              size: buffer.length,
            });
          },
        ),
        getPrivateDownloadUrl: jest.fn((key: string) =>
          Promise.resolve(
            `https://private-r2.test/signed/${encodeURIComponent(key)}`,
          ),
        ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.reportExport.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.salePayment.deleteMany();
    await prisma.saleReturnItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.checkoutGroup.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.saleReturn.deleteMany();
    await prisma.saleStockAllocation.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.marketplaceOffer.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.supplierProduct.deleteMany();
    await prisma.productRequest.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.manufacturer.deleteMany();
    await prisma.pharmacy.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);
    const pharmacyUser = await prisma.user.create({
      data: {
        email: 'pos-pharmacy@test.com',
        passwordHash,
        firstName: 'POS',
        lastName: 'Pharmacist',
        role: 'PHARMACY',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    pharmacyUserId = pharmacyUser.id;
    const pharmacy = await prisma.pharmacy.create({
      data: {
        userId: pharmacyUser.id,
        name: 'POS Test Pharmacy',
        licenseNumber: 'POS-LICENSE-1',
        address: 'Test address',
        city: 'Test city',
        phone: '0911111111',
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
    pharmacyId = pharmacy.id;

    const otherUser = await prisma.user.create({
      data: {
        email: 'pos-other@test.com',
        passwordHash,
        firstName: 'Other',
        lastName: 'Pharmacist',
        role: 'PHARMACY',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    const otherPharmacy = await prisma.pharmacy.create({
      data: {
        userId: otherUser.id,
        name: 'Other Test Pharmacy',
        licenseNumber: 'POS-LICENSE-2',
        address: 'Other address',
        city: 'Test city',
        phone: '0922222222',
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
    otherPharmacyId = otherPharmacy.id;

    const category = await prisma.category.create({
      data: {
        nameAr: 'اختبار نقطة البيع',
        nameEn: 'POS Test',
        slug: 'pos-test',
      },
    });
    const product = await prisma.product.create({
      data: {
        tradeNameAr: 'دواء اختبار',
        tradeNameEn: 'POS Medicine',
        categoryId: category.id,
        barcode: 'POS-0001',
        unit: 'box',
      },
    });
    productId = product.id;
    salePayload.items[0].productId = productId;

    const concurrentProduct = await prisma.product.create({
      data: {
        tradeNameAr: 'دواء تزامن',
        tradeNameEn: 'Concurrent Medicine',
        categoryId: category.id,
        barcode: 'POS-0002',
        unit: 'box',
      },
    });
    concurrentProductId = concurrentProduct.id;

    const earlyBatch = await prisma.inventory.create({
      data: {
        pharmacyId,
        productId,
        batchNumber: 'POS-EARLY',
        expiryDate: new Date('2028-01-01'),
        purchaseCost: 40,
        quantity: 2,
      },
    });
    earlyBatchId = earlyBatch.id;
    const lateBatch = await prisma.inventory.create({
      data: {
        pharmacyId,
        productId,
        batchNumber: 'POS-LATE',
        expiryDate: new Date('2029-01-01'),
        purchaseCost: 45,
        quantity: 5,
      },
    });
    lateBatchId = lateBatch.id;
    await prisma.inventory.create({
      data: {
        pharmacyId,
        productId: concurrentProductId,
        batchNumber: 'POS-CONCURRENT',
        expiryDate: new Date('2029-01-01'),
        purchaseCost: 5,
        quantity: 1,
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'pos-pharmacy@test.com', password: 'password123' })
      .expect(200);
    pharmacyToken = login.body.data.accessToken;

    const otherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'pos-other@test.com', password: 'password123' })
      .expect(200);
    otherPharmacyToken = otherLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('records discounts, cash change, staff and FEFO batch deductions atomically', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/pos/sales')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(salePayload)
      .expect(201);

    const sale = response.body.data;
    saleId = sale.id;
    saleItemId = sale.items[0].id;
    expect(sale.saleNumber).toMatch(/^SAL-\d{4}-\d{6}$/);
    expect(sale.staffUserId).toBe(pharmacyUserId);
    expect(Number(sale.subtotal)).toBe(400);
    expect(Number(sale.discountAmount)).toBe(58);
    expect(Number(sale.totalAmount)).toBe(342);
    expect(Number(sale.paidAmount)).toBe(342);
    expect(Number(sale.tenderedAmount)).toBe(350);
    expect(Number(sale.changeAmount)).toBe(8);
    expect(sale.paymentStatus).toBe('PAID');
    expect(sale.items[0].stockAllocations).toHaveLength(2);

    const [early, late] = await Promise.all([
      prisma.inventory.findUnique({ where: { id: earlyBatchId } }),
      prisma.inventory.findUnique({ where: { id: lateBatchId } }),
    ]);
    expect(early!.quantity).toBe(0);
    expect(late!.quantity).toBe(3);

    const movements = await prisma.inventoryMovement.findMany({
      where: { saleId, type: 'POS_SALE' },
      orderBy: { batchNumber: 'asc' },
    });
    expect(movements).toHaveLength(2);
    expect(
      movements.reduce((sum, movement) => sum + movement.quantity, 0),
    ).toBe(4);
  });

  it('replays the same mutation without deducting stock twice', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/pos/sales')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(salePayload)
      .expect(201);

    expect(response.body.data.id).toBe(saleId);
    expect(await prisma.sale.count()).toBe(1);
    expect(
      await prisma.inventoryMovement.count({
        where: { saleId, type: 'POS_SALE' },
      }),
    ).toBe(2);
  });

  it('rejects reuse of a mutation ID with a different payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/pos/sales')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({
        ...salePayload,
        items: [{ ...salePayload.items[0], quantity: 1 }],
      })
      .expect(409);
  });

  it('records a partial return and restores the exact original batch', async () => {
    const returnMutationId = randomUUID();
    const payload = {
      items: [{ saleItemId, quantity: 1 }],
      reason: 'Customer returned unopened medicine',
      refunds: [{ method: 'CASH', amount: 85.5 }],
      clientMutationId: returnMutationId,
      deviceId: 'pos-e2e-terminal',
    };
    const response = await request(app.getHttpServer())
      .post(`/api/v1/pos/sales/${saleId}/returns`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(payload)
      .expect(201);

    expect(response.body.data.type).toBe('RETURN');
    expect(Number(response.body.data.returnAmount)).toBe(85.5);
    expect(Number(response.body.data.refundAmount)).toBe(85.5);

    const [sale, earlyBatch] = await Promise.all([
      prisma.sale.findUnique({ where: { id: saleId } }),
      prisma.inventory.findUnique({ where: { id: earlyBatchId } }),
    ]);
    expect(sale!.status).toBe('PARTIALLY_RETURNED');
    expect(sale!.paymentStatus).toBe('PARTIALLY_REFUNDED');
    expect(earlyBatch!.quantity).toBe(1);

    const replay = await request(app.getHttpServer())
      .post(`/api/v1/pos/sales/${saleId}/returns`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(payload)
      .expect(201);
    expect(replay.body.data.id).toBe(response.body.data.id);
    expect(
      await prisma.inventoryMovement.count({
        where: { saleReturnId: response.body.data.id, type: 'POS_RETURN' },
      }),
    ).toBe(1);
  });

  it('prevents over-return and cancellation after a partial return', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/pos/sales/${saleId}/returns`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({
        items: [{ saleItemId, quantity: 4 }],
        reason: 'Invalid over-return attempt',
        refunds: [],
        clientMutationId: randomUUID(),
        deviceId: 'pos-e2e-terminal',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/pos/sales/${saleId}/cancel`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({
        reason: 'Cannot cancel after return',
        refunds: [],
        clientMutationId: randomUUID(),
        deviceId: 'pos-e2e-terminal',
      })
      .expect(409);
  });

  it('cancels a separate sale, refunds payment and restores its stock once', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/pos/sales')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send({
        items: [{ productId, quantity: 1, unitPrice: 50 }],
        payments: [{ method: 'CASH', amount: 50 }],
        clientMutationId: randomUUID(),
        deviceId: 'pos-e2e-terminal',
      })
      .expect(201);
    const cancellableSaleId = createResponse.body.data.id;
    const cancellationPayload = {
      reason: 'Transaction entered in error',
      refunds: [{ method: 'CASH', amount: 50 }],
      clientMutationId: randomUUID(),
      deviceId: 'pos-e2e-terminal',
    };
    const cancellation = await request(app.getHttpServer())
      .post(`/api/v1/pos/sales/${cancellableSaleId}/cancel`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(cancellationPayload)
      .expect(201);

    expect(cancellation.body.data.type).toBe('CANCELLATION');
    const cancelledSale = await prisma.sale.findUnique({
      where: { id: cancellableSaleId },
    });
    expect(cancelledSale!.status).toBe('CANCELLED');
    expect(cancelledSale!.paymentStatus).toBe('REFUNDED');

    const replay = await request(app.getHttpServer())
      .post(`/api/v1/pos/sales/${cancellableSaleId}/cancel`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(cancellationPayload)
      .expect(201);
    expect(replay.body.data.id).toBe(cancellation.body.data.id);
  });

  it('prevents concurrent POS sales from overselling server-authoritative stock', async () => {
    const createPayload = () => ({
      items: [{ productId: concurrentProductId, quantity: 1, unitPrice: 10 }],
      payments: [{ method: 'CASH', amount: 10 }],
      clientMutationId: randomUUID(),
      deviceId: 'pos-concurrency-terminal',
    });
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/pos/sales')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send(createPayload()),
      request(app.getHttpServer())
        .post('/api/v1/pos/sales')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send(createPayload()),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 400,
    ]);
    const inventory = await prisma.inventory.findFirst({
      where: { pharmacyId, productId: concurrentProductId },
    });
    expect(inventory!.quantity).toBe(0);
  });

  it('enforces strict pharmacy isolation and records domain audits', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/pos/sales/${saleId}`)
      .set('Authorization', `Bearer ${otherPharmacyToken}`)
      .expect(404);

    const otherSales = await request(app.getHttpServer())
      .get('/api/v1/pos/sales')
      .set('Authorization', `Bearer ${otherPharmacyToken}`)
      .expect(200);
    expect(otherSales.body.data.data).toEqual([]);
    expect(otherPharmacyId).not.toBe(pharmacyId);

    const auditActions = (
      await prisma.auditLog.findMany({
        where: { orgId: pharmacyId },
        select: { action: true },
      })
    ).map((entry) => entry.action);
    expect(auditActions).toContain('POS_SALE_CREATE');
    expect(auditActions).toContain('POS_SALE_RETURN');
    expect(auditActions).toContain('POS_SALE_CANCEL');
  });

  it('reports POS sales and returns with strict role and pharmacy isolation', async () => {
    const catalog = await request(app.getHttpServer())
      .get('/api/v1/reports/catalog')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .expect(200);
    expect(
      catalog.body.data.map((item: { reportType: string }) => item.reportType),
    ).toEqual(
      expect.arrayContaining([
        'PHARMACY_POS_SALES',
        'PHARMACY_POS_RETURNS',
        'INVENTORY_MOVEMENTS',
      ]),
    );

    const sales = await request(app.getHttpServer())
      .get('/api/v1/reports/PHARMACY_POS_SALES')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .expect(200);
    expect(
      sales.body.data.rows.some((row: { saleNumber: string }) =>
        row.saleNumber.startsWith('SAL-'),
      ),
    ).toBe(true);
    expect(Number(sales.body.data.summary.netSales)).toBeGreaterThan(0);

    const returns = await request(app.getHttpServer())
      .get('/api/v1/reports/PHARMACY_POS_RETURNS')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .expect(200);
    expect(returns.body.data.rows).toHaveLength(2);

    const isolated = await request(app.getHttpServer())
      .get('/api/v1/reports/PHARMACY_POS_SALES')
      .set('Authorization', `Bearer ${otherPharmacyToken}`)
      .expect(200);
    expect(isolated.body.data.rows).toEqual([]);

    await request(app.getHttpServer())
      .get('/api/v1/reports/SUPPLIER_SALES')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .expect(403);
  });

  it('exports bounded Excel directly and processes an idempotent private export', async () => {
    const direct = await request(app.getHttpServer())
      .get('/api/v1/reports/PHARMACY_POS_SALES/export')
      .query({ format: 'XLSX', locale: 'AR' })
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .buffer(true)
      .parse(
        (
          response: SupertestResponse,
          callback: (error: Error | null, body: Buffer) => void,
        ) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => callback(null, Buffer.concat(chunks)));
        },
      )
      .expect(200);
    expect(direct.headers['content-type']).toContain('spreadsheetml');
    expect((direct.body as Buffer).subarray(0, 2).toString()).toBe('PK');

    const clientRequestId = randomUUID();
    const payload = {
      reportType: 'PHARMACY_POS_SALES',
      format: 'XLSX',
      locale: 'EN',
      filters: {},
      clientRequestId,
    };
    const queued = await request(app.getHttpServer())
      .post('/api/v1/reports/exports')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(payload)
      .expect(201);
    const exportId = queued.body.data.id;

    const replay = await request(app.getHttpServer())
      .post('/api/v1/reports/exports')
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .send(payload)
      .expect(201);
    expect(replay.body.data.id).toBe(exportId);

    let completed: any;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const state = await request(app.getHttpServer())
        .get(`/api/v1/reports/exports/${exportId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .expect(200);
      if (state.body.data.status === 'COMPLETED') {
        completed = state.body.data;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.rowCount).toBeGreaterThan(0);
    expect(uploadedExports).toContainEqual(
      expect.objectContaining({
        key: expect.stringContaining(
          `private/reports/${pharmacyId}/${exportId}/`,
        ),
        contentType: expect.stringContaining('spreadsheetml'),
      }),
    );

    const download = await request(app.getHttpServer())
      .get(`/api/v1/reports/exports/${exportId}/download`)
      .set('Authorization', `Bearer ${pharmacyToken}`)
      .expect(200);
    expect(download.body.data.url).toContain('https://private-r2.test/signed/');

    await request(app.getHttpServer())
      .get(`/api/v1/reports/exports/${exportId}`)
      .set('Authorization', `Bearer ${otherPharmacyToken}`)
      .expect(404);
  });
});
