import type { AdminApprovalsRepository } from "./admin-approvals.repository";
import { adminApprovalsHttpRepository } from "./admin-approvals.http-repository";

/** Single wiring point for the live organization-approval API adapter. */
export const adminApprovalsRepository: AdminApprovalsRepository = adminApprovalsHttpRepository;
