import type { OrganizationFilters } from "./admin-organizations.types";

export const adminOrganizationsQueryKeys = {
  all: ["admin-organizations"] as const,
  list: (filters?: OrganizationFilters) => [...adminOrganizationsQueryKeys.all, "list", filters ?? {}] as const,
};
