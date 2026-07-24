export type OrganizationType = "pharmacy" | "supplier";
export type OrganizationStatus = "verified" | "pending" | "suspended";

export interface AdminOrganization {
  id: string;
  organizationId?: string;
  name: string;
  type: OrganizationType;
  users: number;
  status: OrganizationStatus;
  memberSince: string; // ISO date
}

export interface OrganizationFilters {
  search?: string;
}
