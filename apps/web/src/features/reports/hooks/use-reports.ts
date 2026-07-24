"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportsRepository } from "../api/reports.repository";
import type { CreateReportExportInput } from "../api/reports.types";

export const reportKeys = {
  all: ["reports"] as const,
  catalog: ["reports", "catalog"] as const,
  exports: ["reports", "exports"] as const,
};

export function useReportCatalog() {
  return useQuery({
    queryKey: reportKeys.catalog,
    queryFn: () => reportsRepository.getCatalog(),
  });
}

export function useReportExports() {
  return useQuery({
    queryKey: reportKeys.exports,
    queryFn: () => reportsRepository.listExports(),
    refetchInterval: (query) =>
      query.state.data?.data.some((job) =>
        job.status === "QUEUED" || job.status === "PROCESSING"
      )
        ? 3000
        : false,
  });
}

export function useCreateReportExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportExportInput) =>
      reportsRepository.createExport(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.exports }),
  });
}

export function useRetryReportExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsRepository.retryExport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.exports }),
  });
}
