import {
  AccountVerificationState,
  OrgStatus,
  UserRole,
  UserStatus,
} from '@pharmasyn/types';
import { resolveAccountVerificationState } from './account-state';

describe('resolveAccountVerificationState', () => {
  const verifiedAt = new Date();

  it.each([
    [
      'unverified email',
      {
        role: UserRole.PHARMACY,
        status: UserStatus.PENDING,
        emailVerifiedAt: null,
        organization: null,
      },
      AccountVerificationState.EMAIL_NOT_VERIFIED,
    ],
    [
      'verified user without an organization',
      {
        role: UserRole.PHARMACY,
        status: UserStatus.PENDING,
        emailVerifiedAt: verifiedAt,
        organization: null,
      },
      AccountVerificationState.ORGANIZATION_PROFILE_REQUIRED,
    ],
    [
      'pending organization',
      {
        role: UserRole.PHARMACY,
        status: UserStatus.PENDING,
        emailVerifiedAt: verifiedAt,
        organization: { status: OrgStatus.PENDING },
      },
      AccountVerificationState.ORGANIZATION_PENDING,
    ],
    [
      'rejected organization',
      {
        role: UserRole.SUPPLIER,
        status: UserStatus.PENDING,
        emailVerifiedAt: verifiedAt,
        organization: { status: OrgStatus.REJECTED },
      },
      AccountVerificationState.ORGANIZATION_REJECTED,
    ],
    [
      'suspended account',
      {
        role: UserRole.PHARMACY,
        status: UserStatus.SUSPENDED,
        emailVerifiedAt: verifiedAt,
        organization: { status: OrgStatus.APPROVED },
      },
      AccountVerificationState.ACCOUNT_SUSPENDED,
    ],
    [
      'banned account',
      {
        role: UserRole.PHARMACY,
        status: UserStatus.BANNED,
        emailVerifiedAt: verifiedAt,
        organization: { status: OrgStatus.APPROVED },
      },
      AccountVerificationState.ACCOUNT_BANNED,
    ],
    [
      'fully active account',
      {
        role: UserRole.PHARMACY,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: verifiedAt,
        organization: { status: OrgStatus.APPROVED },
      },
      AccountVerificationState.ACTIVE,
    ],
  ])('resolves %s', (_name, input, expected) => {
    expect(resolveAccountVerificationState(input)).toBe(expected);
  });
});
