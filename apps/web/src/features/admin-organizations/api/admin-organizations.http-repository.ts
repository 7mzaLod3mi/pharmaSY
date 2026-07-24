import { apiRequest } from "@/lib/http-client";
import type { AdminOrganizationsRepository } from "./admin-organizations.repository";
import type {
  AdminOrganization,
  OrganizationFilters,
  OrganizationStatus,
} from "./admin-organizations.types";

interface AdminUser {
  id: string;
  role: "ADMIN" | "PHARMACY" | "SUPPLIER";
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED";
  createdAt: string;
  pharmacy?: { id: string; name: string; status: string } | null;
  supplier?: { id: string; name: string; status: string } | null;
}

interface UsersResponse {
  data: AdminUser[];
}

function mapStatus(user: AdminUser): OrganizationStatus {
  if (user.status === "SUSPENDED" || user.status === "BANNED") return "suspended";
  const organizationStatus = user.pharmacy?.status ?? user.supplier?.status;
  return organizationStatus === "APPROVED" && user.status === "ACTIVE" ? "verified" : "pending";
}

function mapUser(user: AdminUser): AdminOrganization | null {
  const organization = user.pharmacy ?? user.supplier;
  if (!organization || user.role === "ADMIN") return null;
  return {
    id: user.id,
    organizationId: organization.id,
    name: organization.name,
    type: user.role === "PHARMACY" ? "pharmacy" : "supplier",
    users: 1,
    status: mapStatus(user),
    memberSince: user.createdAt,
  };
}

async function updateAndMap(id: string, action: "suspend" | "activate") {
  const user = await apiRequest<AdminUser>({
    method: "PATCH",
    url: `/admin/users/${id}/${action}`,
  });
  const mapped = mapUser(user);
  if (!mapped) throw new Error("Organization owner account was not found.");
  return mapped;
}

export const adminOrganizationsHttpRepository: AdminOrganizationsRepository = {
  async listOrganizations(filters?: OrganizationFilters) {
    const response = await apiRequest<UsersResponse>({
      method: "GET",
      url: "/admin/users",
      params: { limit: 100 },
    });
    const search = filters?.search?.trim().toLowerCase();
    return response.data
      .map(mapUser)
      .filter((item): item is AdminOrganization => Boolean(item))
      .filter((item) => !search || item.name.toLowerCase().includes(search));
  },
  suspendOrganization(id: string) {
    return updateAndMap(id, "suspend");
  },
  reactivateOrganization(id: string) {
    return updateAndMap(id, "activate");
  },
};
