import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { randomUUID } from 'crypto';

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

describe('Concurrency & Race Conditions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let pharmacyToken: string;
  let supplierId: string;
  let productId: string;
  let spId: string;

  beforeAll(async () => {
    assertDedicatedTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Clean up relevant tables
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.checkoutGroup.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.salePayment.deleteMany();
    await prisma.saleReturnItem.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.saleReturn.deleteMany();
    await prisma.saleStockAllocation.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.marketplaceOffer.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.supplierProduct.deleteMany();
    await prisma.reportExport.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.productRequest.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.pharmacy.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    // 2. Create users and orgs
    const uAdmin = await prisma.user.create({
      data: {
        email: 'admin_c@test.com',
        firstName: 'Admin',
        lastName: 'C',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    const uPharm = await prisma.user.create({
      data: {
        email: 'pharmacy_c@test.com',
        firstName: 'Pharm',
        lastName: 'C',
        passwordHash,
        role: 'PHARMACY',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    const uSupp = await prisma.user.create({
      data: {
        email: 'supp_c@test.com',
        firstName: 'Supp',
        lastName: 'C',
        passwordHash: 'hash',
        role: 'SUPPLIER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.pharmacy.create({
      data: {
        userId: uPharm.id,
        name: 'Pharma C',
        licenseNumber: 'LC_C',
        address: 'Addr',
        city: 'City',
        phone: '123',
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: uAdmin.id,
      },
    });
    const supplier = await prisma.supplier.create({
      data: {
        userId: uSupp.id,
        name: 'Supp C',
        tradeRegister: 'TR_C',
        address: 'Addr',
        city: 'City',
        phone: '123',
        status: 'APPROVED',
        verifiedAt: new Date(),
        verifiedBy: uAdmin.id,
      },
    });

    supplierId = supplier.id;

    // 3. Create product
    const category = await prisma.category.create({
      data: { nameAr: 'Cat', nameEn: 'Cat', slug: 'cat_c' },
    });
    const product = await prisma.product.create({
      data: {
        tradeNameAr: 'Prod C',
        tradeNameEn: 'Prod C',
        categoryId: category.id,
        unit: 'box',
      },
    });
    productId = product.id;

    // 4. Create Supplier Product with EXACTLY 5 stock
    const sp = await prisma.supplierProduct.create({
      data: {
        supplierId,
        productId,
        price: 100,
        stock: 5,
        minOrder: 1,
        isAvailable: true,
      },
    });
    spId = sp.id;

    const pharmLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'pharmacy_c@test.com', password: 'password123' });
    pharmacyToken = pharmLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should prevent overselling when 5 concurrent checkout requests try to buy 2 items each (total 10) when only 5 exist', async () => {
    // We send 5 identical checkout requests AT THE EXACT SAME TIME
    const checkoutDto = {
      groups: [
        {
          supplierId,
          items: [{ supplierProductId: spId, quantity: 2, price: 100 }],
        },
      ],
    };

    const requests = Array.from({ length: 5 }).map(() =>
      request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          ...checkoutDto,
          clientMutationId: randomUUID(),
          deviceId: 'concurrency-e2e',
        }),
    );

    const responses = await Promise.all(requests);

    let successCount = 0;
    let failCount = 0;

    for (const res of responses) {
      if (res.status === 201) successCount++;
      else if (res.status === 400) failCount++;
      else console.error('Unexpected status:', res.status, res.body);
    }

    // Since we only have 5 stock, and each request buys 2:
    // Request 1: buys 2 (remaining 3) -> SUCCESS
    // Request 2: buys 2 (remaining 1) -> SUCCESS
    // Request 3: tries to buy 2 (remaining 1) -> FAILS (Insufficient stock)
    // Request 4: tries to buy 2 (remaining 1) -> FAILS
    // Request 5: tries to buy 2 (remaining 1) -> FAILS
    expect(successCount).toBe(2);
    expect(failCount).toBe(3);

    // Verify final stock is exactly 1 (not negative!)
    const sp = await prisma.supplierProduct.findUnique({ where: { id: spId } });
    expect(sp).not.toBeNull();
    expect(sp!.stock).toBe(1);
  });
});
