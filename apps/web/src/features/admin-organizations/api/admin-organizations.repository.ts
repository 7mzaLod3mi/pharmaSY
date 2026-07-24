import type { AdminOrganization, OrganizationFilters } from "./admin-organizations.types";

export interface AdminOrganizationsRepository {
  listOrganizations(filters?: OrganizationFilters): Promise<AdminOrganization[]>;
  suspendOrganization(id: string): Promise<AdminOrganization>;
  reactivateOrganization(id: string): Promise<AdminOrganization>;
}
