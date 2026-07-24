import type { AdminOrganizationsRepository } from "./admin-organizations.repository";
import { adminOrganizationsHttpRepository } from "./admin-organizations.http-repository";

/** Maps live admin user controls to the organization-owner table. */
export const adminOrganizationsRepository: AdminOrganizationsRepository =
  adminOrganizationsHttpRepository;
