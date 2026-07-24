import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@pharmasyn/types';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@e2e.com' },
    update: { passwordHash, emailVerifiedAt: now, status: 'ACTIVE' },
    create: {
      email: 'admin@e2e.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Test',
      role: UserRole.ADMIN,
      status: 'ACTIVE',
      emailVerifiedAt: now,
    }
  });

  // 2. Supplier
  const supplier = await prisma.user.upsert({
    where: { email: 'supplier@e2e.com' },
    update: { passwordHash, emailVerifiedAt: now, status: 'ACTIVE' },
    create: {
      email: 'supplier@e2e.com',
      passwordHash,
      firstName: 'Supp',
      lastName: 'Test',
      role: UserRole.SUPPLIER,
      status: 'ACTIVE',
      emailVerifiedAt: now,
    }
  });

  await prisma.supplier.upsert({
    where: { userId: supplier.id },
    update: { status: 'APPROVED', verifiedAt: now, verifiedBy: admin.id },
    create: {
      userId: supplier.id,
      name: 'E2E Supplier',
      city: 'TestCity',
      address: 'TestAddress',
      phone: '123',
      tradeRegister: 'REG-123',
      status: 'APPROVED',
      verifiedAt: now,
      verifiedBy: admin.id,
    }
  });

  // 3. Pharmacy
  const pharmacy = await prisma.user.upsert({
    where: { email: 'pharmacy@e2e.com' },
    update: { passwordHash, emailVerifiedAt: now, status: 'ACTIVE' },
    create: {
      email: 'pharmacy@e2e.com',
      passwordHash,
      firstName: 'Pharm',
      lastName: 'Test',
      role: UserRole.PHARMACY,
      status: 'ACTIVE',
      emailVerifiedAt: now,
    }
  });

  await prisma.pharmacy.upsert({
    where: { userId: pharmacy.id },
    update: { status: 'APPROVED', approvedAt: now, approvedBy: admin.id },
    create: {
      userId: pharmacy.id,
      name: 'E2E Pharmacy',
      city: 'TestCity',
      address: 'TestAddress',
      phone: '123',
      licenseNumber: 'L-123',
      status: 'APPROVED',
      approvedAt: now,
      approvedBy: admin.id,
    }
  });

  console.log('Successfully seeded Admin, Supplier, and Pharmacy accounts with password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
