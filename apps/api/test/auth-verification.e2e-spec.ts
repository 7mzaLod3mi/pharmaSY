/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@pharmasyn/types';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/notifications/email.service';

jest.setTimeout(30_000);

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
      'Refusing E2E writes: database name or schema must contain "test"',
    );
  }
}

describe('Two-stage account verification (e2e)', () => {
  const ownerEmail = 'verification-owner@e2e.test';
  const adminEmail = 'verification-admin@e2e.test';
  const password = 'StrongPass1';
  const emailService = {
    sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
  };
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerId: string;
  let pharmacyId: string;
  let ownerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    assertDedicatedTestDatabase();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailService)
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

    await cleanup();
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(password, 10),
        firstName: 'Verification',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    ownerId = admin.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    if (prisma) await cleanup();
    if (app) await app.close();
  });

  async function cleanup() {
    const users = await prisma.user.findMany({
      where: { email: { in: [ownerEmail, adminEmail] } },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);
    if (!ids.length) return;
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.pharmacy.deleteMany({ where: { userId: { in: ids } } });
    await prisma.emailVerification.deleteMany({
      where: { userId: { in: ids } },
    });
    await prisma.passwordReset.deleteMany({ where: { userId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  async function waitForVerificationEmail(previousCallCount = 0) {
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      const calls = emailService.sendNotificationEmail.mock.calls.filter(
        ([to]) => to === ownerEmail,
      );
      if (calls.length > previousCallCount) return calls.at(-1);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Timed out waiting for the verification email worker');
  }

  it('returns the exact validation message instead of "Validation failed"', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(response.body.message).not.toBe('Validation failed');
    expect(response.body.message).toBeTruthy();
  });

  it('registers, queues an OTP, and blocks login until email verification', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: ownerEmail,
        firstName: 'Pharmacy',
        lastName: 'Owner',
        password,
        role: UserRole.PHARMACY,
      })
      .expect(201);

    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: ownerEmail },
    });
    ownerId = owner.id;
    expect(owner.status).toBe('PENDING');
    expect(owner.emailVerifiedAt).toBeNull();

    const firstDelivery = await waitForVerificationEmail();
    expect(firstDelivery).toBeDefined();
    const html = String(firstDelivery?.[2]);
    const otp = html.match(/>(\d{6})</)?.[1];
    expect(otp).toMatch(/^\d{6}$/);

    const blocked = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password })
      .expect(401);
    expect(blocked.body.code).toBe('EMAIL_NOT_VERIFIED');

    const previousDeliveryCount =
      emailService.sendNotificationEmail.mock.calls.filter(
        ([to]) => to === ownerEmail,
      ).length;
    await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .send({ email: ownerEmail })
      .expect(200);
    const resentDelivery = await waitForVerificationEmail(
      previousDeliveryCount,
    );
    const resentOtp = String(resentDelivery?.[2]).match(/>(\d{6})</)?.[1];
    expect(resentOtp).toMatch(/^\d{6}$/);

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ email: ownerEmail, otp })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ email: ownerEmail, otp: resentOtp })
      .expect(200);
  });

  it('allows onboarding but keeps the organization pending until Admin approval', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);
    ownerToken = login.body.data.accessToken;
    expect(login.body.data.user.accountState).toBe(
      'ORGANIZATION_PROFILE_REQUIRED',
    );

    const profile = await request(app.getHttpServer())
      .post('/api/v1/pharmacies/profile')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Verification Pharmacy',
        licenseNumber: 'VERIFY-LICENSE-001',
        address: 'Verification Street 10',
        city: 'Damascus',
        phone: '0912345678',
      })
      .expect(201);
    pharmacyId = profile.body.data.id;

    const pendingLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);
    expect(pendingLogin.body.data.user.accountState).toBe(
      'ORGANIZATION_PENDING',
    );

    await prisma.user.update({
      where: { id: ownerId },
      data: { status: 'ACTIVE' },
    });
    const statusResponse = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${pendingLogin.body.data.accessToken}`)
      .expect(200);
    expect(statusResponse.body.data.accountState).toBe('ORGANIZATION_PENDING');

    await prisma.user.update({
      where: { id: ownerId },
      data: { emailVerifiedAt: null },
    });
    const unverifiedSession = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${pendingLogin.body.data.accessToken}`)
      .expect(401);
    expect(unverifiedSession.body.code).toBe('EMAIL_NOT_VERIFIED');

    await prisma.user.update({
      where: { id: ownerId },
      data: { emailVerifiedAt: new Date(), status: 'PENDING' },
    });
  });

  it('activates both organization and user through Admin approval', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/pharmacies/${pharmacyId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const [owner, pharmacy] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: ownerId } }),
      prisma.pharmacy.findUniqueOrThrow({ where: { id: pharmacyId } }),
    ]);
    expect(owner.status).toBe('ACTIVE');
    expect(pharmacy.status).toBe('APPROVED');

    const activeLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);
    expect(activeLogin.body.data.user.role).toBe(UserRole.PHARMACY);
    expect(activeLogin.body.data.user.accountState).toBe('ACTIVE');
    expect(activeLogin.body.data.user.orgStatus).toBe('APPROVED');
  });

  it('returns the organization rejection reason to the owner', async () => {
    await prisma.$transaction([
      prisma.pharmacy.update({
        where: { id: pharmacyId },
        data: {
          status: 'REJECTED',
          rejectionNote: 'The submitted license document is unreadable.',
        },
      }),
      prisma.user.update({
        where: { id: ownerId },
        data: { status: 'PENDING' },
      }),
    ]);

    const rejectedLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password })
      .expect(200);
    expect(rejectedLogin.body.data.user.accountState).toBe(
      'ORGANIZATION_REJECTED',
    );
    expect(rejectedLogin.body.data.user.organizationRejectionReason).toBe(
      'The submitted license document is unreadable.',
    );
  });

  it.each([
    ['SUSPENDED', 'ACCOUNT_SUSPENDED'],
    ['BANNED', 'ACCOUNT_BANNED'],
  ])('returns a distinct error for a %s account', async (status, code) => {
    await prisma.user.update({
      where: { id: ownerId },
      data: { status: status as 'SUSPENDED' | 'BANNED' },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password })
      .expect(401);
    expect(response.body.code).toBe(code);
  });
});
