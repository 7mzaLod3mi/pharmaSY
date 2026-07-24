import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { UserRole, ProductStatus, RequestStatus } from '@pharmasyn/types';
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
    throw new Error('Refusing destructive E2E cleanup: database name or schema must contain "test"');
  }
}

describe('End-to-End Business Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let supplierToken: string;
  let pharmacyToken: string;
  
  let adminId: string;
  let supplierId: string;
  let pharmacyId: string;
  let pharmacyProfileId: string;
  let supplierProfileId: string;

  let categoryId: string;
  let manufacturerId: string;
  let masterProductId: string;
  let productRequestId: string;
  let supplierProductId: string;
  let orderId: string;

  beforeAll(async () => {
    assertDedicatedTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
      })
    );
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Clear Database (Order matters due to FK constraints)
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

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('password123', 10);

    // Seed Admin
    const admin = await prisma.user.create({
      data: { email: 'admin@e2e.com', passwordHash, firstName: 'Admin', lastName: 'Test', role: UserRole.ADMIN, status: 'ACTIVE', emailVerifiedAt: new Date() }
    });
    adminId = admin.id;

    // Seed Supplier User & Profile
    const supplier = await prisma.user.create({
      data: { email: 'supplier@e2e.com', passwordHash, firstName: 'Supp', lastName: 'Test', role: UserRole.SUPPLIER, status: 'ACTIVE', emailVerifiedAt: new Date() }
    });
    supplierId = supplier.id;
    const suppProfile = await prisma.supplier.create({
      data: { userId: supplierId, name: 'E2E Supplier', city: 'TestCity', address: 'TestAddress', phone: '123', tradeRegister: 'REG-123', status: 'APPROVED', verifiedAt: new Date(), verifiedBy: adminId }
    });
    supplierProfileId = suppProfile.id;

    // Seed Pharmacy User & Profile
    const pharmacy = await prisma.user.create({
      data: { email: 'pharmacy@e2e.com', passwordHash, firstName: 'Pharm', lastName: 'Test', role: UserRole.PHARMACY, status: 'ACTIVE', emailVerifiedAt: new Date() }
    });
    pharmacyId = pharmacy.id;
    const pharmProfile = await prisma.pharmacy.create({
      data: { userId: pharmacyId, name: 'E2E Pharmacy', city: 'TestCity', address: 'TestAddress', phone: '123', licenseNumber: 'L-123', status: 'APPROVED', approvedAt: new Date(), approvedBy: adminId }
    });
    pharmacyProfileId = pharmProfile.id;

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'admin@e2e.com', password: 'password123' });
    if (!adminLogin.body.data) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.body));
    adminToken = adminLogin.body.data.accessToken;

    const suppLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'supplier@e2e.com', password: 'password123' });
    if (!suppLogin.body.data) throw new Error('Supplier login failed: ' + JSON.stringify(suppLogin.body));
    supplierToken = suppLogin.body.data.accessToken;

    const pharmLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'pharmacy@e2e.com', password: 'password123' });
    if (!pharmLogin.body.data) throw new Error('Pharmacy login failed: ' + JSON.stringify(pharmLogin.body));
    pharmacyToken = pharmLogin.body.data.accessToken;

    // Seed base taxonomy
    const category = await prisma.category.create({ data: { nameEn: 'Painkillers', nameAr: 'مسكنات', slug: 'painkillers' } });
    categoryId = category.id;

    const manufacturer = await prisma.manufacturer.create({ data: { name: 'E2E Pharma' } });
    manufacturerId = manufacturer.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Phase 1: Authentication & Authorization', () => {
    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .expect(401);
    });

    it('should prevent Supplier from creating a Master Product (Admin Only)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({ tradeNameAr: 'Test', tradeNameEn: 'Test', barcode: '12345', categoryId })
        .expect(403);
    });
  });

  describe('Phase 2: Master Catalog & Product Requests', () => {
    it('should allow Admin to seed initial catalog product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tradeNameAr: 'باندول',
          tradeNameEn: 'Panadol',
          categoryId,
          manufacturerId,
          unit: 'box',
          barcode: '1234567890',
          strength: '500mg'
        });
      
      if (res.status !== 201) {
        console.log('Seed Master Catalog failed:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      
      masterProductId = res.body.data.id;
      expect(masterProductId).toBeDefined();
    });

    it('should allow Supplier to create a ProductRequest (simulating unknown import)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/product-requests')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          brandName: 'New Drug',
          barcode: 'UNKNOWN-002',
          dosageForm: 'Syrup'
        })
        .expect(201);
      
      productRequestId = res.body.data.id;
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should allow Admin to retrieve pending requests and detect duplicates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/product-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(productRequestId);
    });

    it('should allow Admin to approve a ProductRequest and auto-create Product', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/product-requests/${productRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId })
        .expect(200);
      
      expect(res.body.data.request.status).toBe('APPROVED');
      
      // Verify product was created
      const newProduct = await prisma.product.findFirst({ where: { barcode: 'UNKNOWN-002' } });
      expect(newProduct).toBeDefined();
      expect(newProduct?.tradeNameEn).toBe('New Drug');
    });

    it('should record an AuditLog for the approval', async () => {
      const logs = await prisma.auditLog.findMany({ where: { entityId: productRequestId } });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.action === 'APPROVE_PRODUCT_REQUEST')).toBe(true);
    });
  });

  describe('Phase 3: Supplier Inventory & Constraints', () => {
    it('should allow Supplier to create an offer for the approved product', async () => {
      // Find the new product id
      const product = await prisma.product.findFirst({ where: { barcode: 'UNKNOWN-002' } });
      
      const res = await request(app.getHttpServer())
        .post('/api/v1/supplier-products')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          productId: product!.id,
          price: 5000,
          stock: 100,
          minOrder: 5,
          expiryDate: new Date('2028-01-01').toISOString(),
          batchNumber: 'BATCH-X'
        })
        .expect(201);

      supplierProductId = res.body.data.id;
      expect(supplierProductId).toBeDefined();
    });

    it('should increment version when Admin edits a product', async () => {
      const product = await prisma.product.findFirst({ where: { barcode: 'UNKNOWN-002' } });
      const currentVersion = product!.version;

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${product!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tradeNameEn: 'New Drug Updated' })
        .expect(200);

      const updated = await prisma.product.findUnique({ where: { id: product!.id } });
      expect(updated!.version).toBe(currentVersion + 1);
    });

    it('should not allow offers for ARCHIVED products', async () => {
      // Archive the first product
      await request(app.getHttpServer())
        .delete(`/api/v1/products/${masterProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Attempt to create offer
      await request(app.getHttpServer())
        .post('/api/v1/supplier-products')
        .set('Authorization', `Bearer ${supplierToken}`)
        .send({
          productId: masterProductId,
          price: 1000,
          stock: 10
        })
        .expect(409); // Conflict (Product is archived)
    });
  });

  describe('Phase 4: Pharmacy Ordering & Fulfillment', () => {
    it('should allow Pharmacy to search supplier products', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/marketplace/products')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .expect(200);
      
      expect(res.body.data.data.length).toBe(1); // Only active offers
      expect(res.body.data.data[0].id).toBe(supplierProductId);
    });

    it('should allow Pharmacy to checkout and create Order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          clientMutationId: randomUUID(),
          deviceId: 'workflow-e2e',
          groups: [
            {
              supplierId: supplierProfileId,
              items: [
                {
                  supplierProductId,
                  quantity: 10,
                  price: 5000
                }
              ]
            }
          ]
        });
      
      if (res.status !== 201) {
        console.log('Checkout failed:', JSON.stringify(res.body, null, 2));
      }
      expect(res.status).toBe(201);
      
      expect(res.body.data.orders.length).toBe(1);
      orderId = res.body.data.orders[0].id;
      expect(res.body.data.orders[0].status).toBe('PENDING');
    });

    it('should require the full fulfillment lifecycle and update inventory on delivery', async () => {
      for (const status of ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']) {
        const res = await request(app.getHttpServer())
          .patch(`/api/v1/orders/${orderId}/status`)
          .set('Authorization', `Bearer ${supplierToken}`)
          .send({ status });
        if (res.status !== 200) {
          console.log(`${status} failed:`, JSON.stringify(res.body, null, 2));
        }
        expect(res.status).toBe(200);
      }

      // Check Pharmacy Inventory
      const inventory = await prisma.inventory.findMany({
        where: { pharmacyId: pharmacyProfileId }
      });
      expect(inventory.length).toBe(1);
      expect(inventory[0]!.quantity).toBe(10);
    });
  });

  describe('Phase 5: Integrity Checks', () => {
    it('should not have duplicate barcodes in Master Catalog', async () => {
      const products = await prisma.product.findMany();
      const barcodes = products.map(p => p.barcode);
      const uniqueBarcodes = new Set(barcodes);
      expect(barcodes.length).toBe(uniqueBarcodes.size);
    });
  });

  describe('Phase 7: Enterprise Inventory Engine', () => {
    let batchId: string;
    
    it('should have created an inventory batch from supplier delivery', async () => {
      const batches = await prisma.inventory.findMany({ where: { pharmacyId: pharmacyProfileId } });
      expect(batches.length).toBe(1);
      expect(batches[0]!.quantity).toBe(10);
      expect(batches[0]!.batchNumber).toBeDefined();
      expect(batches[0]!.purchaseCost).toBeDefined();
      batchId = batches[0]!.id;
    });

    it('should have logged a SUPPLIER_PURCHASE movement', async () => {
      const movements = await prisma.inventoryMovement.findMany({ where: { inventoryId: batchId } });
      expect(movements.length).toBe(1);
      expect(movements[0].type).toBe('SUPPLIER_PURCHASE');
      expect(movements[0].difference).toBe(10);
    });

    it('should allow Pharmacy to publish a Marketplace Offer from specific batch', async () => {
      const batch = await prisma.inventory.findUnique({ where: { id: batchId } });
      
      const res = await request(app.getHttpServer())
        .post('/api/v1/exchange/offers')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          productId: batch!.productId,
          quantity: 2,
          price: 5500,
          batchNumber: batch!.batchNumber,
          expiryDate: batch!.expiryDate.toISOString()
        });
      if (res.status !== 201) console.log('Offer failed:', JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      
      const updatedBatch = await prisma.inventory.findUnique({ where: { id: batchId } });
      expect(updatedBatch!.reservedStock).toBe(2);
    });

    it('should retrieve dashboard metrics correctly', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory/dashboard')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .expect(200);
      
      expect(res.body.data.totalBatches).toBe(1);
      expect(res.body.data.available).toBe(8); // 10 - 2 reserved
      expect(res.body.data.reserved).toBe(2);
    });
  });
});
