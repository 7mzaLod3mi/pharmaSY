import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgStatus, UserRole, UserStatus } from '@pharmasyn/types';
import { OrganizationStatusGuard } from './organization-status.guard';

function contextWithUser(user: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () =>
      ({
        getRequest: () => ({ user }),
      }) as never,
  } as never;
}

describe('OrganizationStatusGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  let guard: OrganizationStatusGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new OrganizationStatusGuard(reflector as unknown as Reflector);
  });

  it('blocks a pending organization from protected operations', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(() =>
      guard.canActivate(
        contextWithUser({
          role: UserRole.PHARMACY,
          status: UserStatus.PENDING,
          orgId: 'pharmacy-1',
          orgStatus: OrgStatus.PENDING,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows a pending user only on explicitly marked onboarding operations', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    expect(
      guard.canActivate(
        contextWithUser({
          role: UserRole.PHARMACY,
          status: UserStatus.PENDING,
        }),
      ),
    ).toBe(true);
  });

  it('allows an active user to read onboarding status when the organization is pending', () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    expect(
      guard.canActivate(
        contextWithUser({
          role: UserRole.PHARMACY,
          status: UserStatus.ACTIVE,
          orgId: 'pharmacy-1',
          orgStatus: OrgStatus.PENDING,
        }),
      ),
    ).toBe(true);
  });

  it('allows an active user from an approved organization', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(
      guard.canActivate(
        contextWithUser({
          role: UserRole.SUPPLIER,
          status: UserStatus.ACTIVE,
          orgId: 'supplier-1',
          orgStatus: OrgStatus.APPROVED,
        }),
      ),
    ).toBe(true);
  });

  it('blocks an inactive administrator', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(() =>
      guard.canActivate(
        contextWithUser({
          role: UserRole.ADMIN,
          status: UserStatus.PENDING,
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
