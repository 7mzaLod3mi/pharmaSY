"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApprovalsRepository } from "../api/admin-approvals.repository.instance";
import { adminApprovalsQueryKeys } from "../api/admin-approvals.query-keys";

export function useAdminApprovals() {
  return useQuery({
    queryKey: adminApprovalsQueryKeys.list(),
    queryFn: () => adminApprovalsRepository.listPendingApprovals(),
  });
}

export function useApproveOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApprovalsRepository.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminApprovalsQueryKeys.all }),
  });
}

export function useRejectOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApprovalsRepository.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminApprovalsQueryKeys.all }),
  });
}
