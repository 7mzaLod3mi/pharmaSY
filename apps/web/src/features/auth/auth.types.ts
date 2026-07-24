import type { Role } from "@/lib/permissions";
import type { AccountVerificationState } from "@pharmasyn/types";

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED";
export type OrganizationStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface OrganizationSummary {
  id: string;
  name: string;
  status: OrganizationStatus;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role: Role;
  status: UserStatus;
  createdAt?: string;
  orgId?: string | null;
  orgName?: string | null;
  orgStatus?: OrganizationStatus | null;
  requiresOrganizationApproval?: boolean;
  emailVerifiedAt?: string | null;
  accountState?: AccountVerificationState;
  organizationRejectionReason?: string | null;
  pharmacy?: OrganizationSummary | null;
  supplier?: OrganizationSummary | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  role: "PHARMACY" | "SUPPLIER";
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}
