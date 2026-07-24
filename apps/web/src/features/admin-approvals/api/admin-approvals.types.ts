export type ApprovalOrgType = "pharmacy" | "supplier";

export interface ApprovalRequest {
  id: string;
  name: string;
  type: ApprovalOrgType;
  submittedAt: string; // ISO date
  contactEmail: string;
  documents: string[];
}
