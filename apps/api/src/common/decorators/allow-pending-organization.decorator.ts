import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_ORGANIZATION_KEY = 'allowPendingOrganization';
export const AllowPendingOrganization = () =>
  SetMetadata(ALLOW_PENDING_ORGANIZATION_KEY, true);
