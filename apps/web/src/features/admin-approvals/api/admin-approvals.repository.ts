import type { ApprovalRequest } from "./admin-approvals.types";

export interface AdminApprovalsRepository {
  listPendingApprovals(): Promise<ApprovalRequest[]>;
  approve(id: string): Promise<void>;
  reject(id: string, reason?: string): Promise<void>;
}
