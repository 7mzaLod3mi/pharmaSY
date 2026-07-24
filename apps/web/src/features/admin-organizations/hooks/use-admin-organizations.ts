"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminOrganizationsRepository } from "../api/admin-organizations.repository.instance";
import { adminOrganizationsQueryKeys } from "../api/admin-organizations.query-keys";
import type { OrganizationFilters } from "../api/admin-organizations.types";

export function useAdminOrganizations(filters?: OrganizationFilters) {
  return useQuery({
    queryKey: adminOrganizationsQueryKeys.list(filters),
    queryFn: () => adminOrganizationsRepository.listOrganizations(filters),
  });
}

export function useSuspendOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminOrganizationsRepository.suspendOrganization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminOrganizationsQueryKeys.all }),
  });
}

export function useReactivateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminOrganizationsRepository.reactivateOrganization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminOrganizationsQueryKeys.all }),
  });
}
