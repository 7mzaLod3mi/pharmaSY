import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@pharmasyn/types';
import { AuthService } from './auth.service';

describe('AuthService security invariants', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = {};
  const configService = {};
  const emailQueue = {
    add: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as never,
      jwtService as never,
      configService as never,
      emailQueue as never,
    );
  });

  it('rejects administrator self-registration before touching persistence', async () => {
    await expect(
      service.register({
        email: 'admin@example.com',
        firstName: 'System',
        lastName: 'Admin',
        password: 'StrongPass1',
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it('rejects refresh attempts without a cookie', () => {
    expect(() => service.rejectMissingRefreshToken()).toThrow(
      UnauthorizedException,
    );
  });

  it('does not create an account when email delivery is not configured', async () => {
    service = new AuthService(
      prisma as never,
      jwtService as never,
      {
        get: (key: string, fallback?: string) =>
          key === 'NODE_ENV' ? 'development' : fallback,
      } as never,
      emailQueue as never,
    );

    await expect(
      service.register({
        email: 'owner@example.com',
        firstName: 'Pharmacy',
        lastName: 'Owner',
        password: 'StrongPass1',
        role: UserRole.PHARMACY,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
