export const adminApprovalsQueryKeys = {
  all: ["admin-approvals"] as const,
  list: () => [...adminApprovalsQueryKeys.all, "list"] as const,
};
