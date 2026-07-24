import {
  AccountVerificationState,
  OrgStatus,
  UserRole,
  UserStatus,
} from '@pharmasyn/types';

export interface AccountStateInput {
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt?: Date | null;
  organization?: {
    status: OrgStatus;
  } | null;
}

export function resolveAccountVerificationState({
  role,
  status,
  emailVerifiedAt,
  organization,
}: AccountStateInput): AccountVerificationState {
  if (status === UserStatus.BANNED) {
    return AccountVerificationState.ACCOUNT_BANNED;
  }

  if (
    status === UserStatus.SUSPENDED ||
    organization?.status === OrgStatus.SUSPENDED
  ) {
    return AccountVerificationState.ACCOUNT_SUSPENDED;
  }

  if (!emailVerifiedAt) {
    return AccountVerificationState.EMAIL_NOT_VERIFIED;
  }

  if (role === UserRole.ADMIN) {
    return status === UserStatus.ACTIVE
      ? AccountVerificationState.ACTIVE
      : AccountVerificationState.ORGANIZATION_PENDING;
  }

  if (!organization) {
    return AccountVerificationState.ORGANIZATION_PROFILE_REQUIRED;
  }

  if (organization.status === OrgStatus.REJECTED) {
    return AccountVerificationState.ORGANIZATION_REJECTED;
  }

  if (
    organization.status !== OrgStatus.APPROVED ||
    status !== UserStatus.ACTIVE
  ) {
    return AccountVerificationState.ORGANIZATION_PENDING;
  }

  return AccountVerificationState.ACTIVE;
}
