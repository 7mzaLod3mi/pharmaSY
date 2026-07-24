import { apiRequest } from "@/lib/http-client";
import type { AdminApprovalsRepository } from "./admin-approvals.repository";
import type { ApprovalOrgType, ApprovalRequest } from "./admin-approvals.types";

interface PendingOrganization {
  id: string;
  name: string;
  createdAt: string;
  licenseUrl?: string | null;
  commercialRegisterUrl?: string | null;
  taxCertificateUrl?: string | null;
  user: {
    email: string;
    createdAt: string;
  };
}

interface PendingResponse {
  data: PendingOrganization[];
}

const typeById = new Map<string, ApprovalOrgType>();

function mapOrganization(item: PendingOrganization, type: ApprovalOrgType): ApprovalRequest {
  typeById.set(item.id, type);
  return {
    id: item.id,
    name: item.name,
    type,
    submittedAt: item.createdAt ?? item.user.createdAt,
    contactEmail: item.user.email,
    documents: [
      item.licenseUrl ? "License" : null,
      item.commercialRegisterUrl ? "Commercial register" : null,
      item.taxCertificateUrl ? "Tax certificate" : null,
    ].filter((value): value is string => Boolean(value)),
  };
}

async function organizationType(id: string) {
  const cached = typeById.get(id);
  if (cached) return cached;
  const all = await adminApprovalsHttpRepository.listPendingApprovals();
  return all.find((item) => item.id === id)?.type;
}

export const adminApprovalsHttpRepository: AdminApprovalsRepository = {
  async listPendingApprovals() {
    const [pharmacies, suppliers] = await Promise.all([
      apiRequest<PendingResponse>({ method: "GET", url: "/admin/pending/pharmacies", params: { limit: 100 } }),
      apiRequest<PendingResponse>({ method: "GET", url: "/admin/pending/suppliers", params: { limit: 100 } }),
    ]);
    return [
      ...pharmacies.data.map((item) => mapOrganization(item, "pharmacy")),
      ...suppliers.data.map((item) => mapOrganization(item, "supplier")),
    ].sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
  },
  async approve(id: string) {
    const type = await organizationType(id);
    if (!type) throw new Error("Organization approval request was not found.");
    await apiRequest({ method: "PATCH", url: `/admin/${type === "pharmacy" ? "pharmacies" : "suppliers"}/${id}/approve` });
    typeById.delete(id);
  },
  async reject(id: string, reason?: string) {
    const type = await organizationType(id);
    if (!type) throw new Error("Organization approval request was not found.");
    await apiRequest({
      method: "PATCH",
      url: `/admin/${type === "pharmacy" ? "pharmacies" : "suppliers"}/${id}/reject`,
      data: { reason: reason?.trim() || "Rejected after administrator review." },
    });
    typeById.delete(id);
  },
};
