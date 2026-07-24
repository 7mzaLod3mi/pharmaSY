"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/http-client";

export interface SupplierImportJob {
  id: string;
  fileName: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows?: number | null;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  errors?: Array<{ row?: number; message: string }> | null;
  processedAt?: string | null;
  createdAt: string;
}

export function useSupplierImportHistory() {
  return useQuery({
    queryKey: ["supplier", "import-history"],
    queryFn: () =>
      apiRequest<SupplierImportJob[]>({ method: "GET", url: "/import/history" }),
    refetchInterval: (query) =>
      query.state.data?.some(
        (job) => job.status === "QUEUED" || job.status === "PROCESSING"
      )
        ? 3000
        : false,
  });
}

export function useSupplierImportStatus(id: string) {
  return useQuery({
    queryKey: ["supplier", "import-status", id],
    queryFn: () =>
      apiRequest<SupplierImportJob>({
        method: "GET",
        url: `/import/${id}`,
      }),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "QUEUED" || status === "PROCESSING" ? 3000 : false;
    },
  });
}

export function useUploadSupplierExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      return apiRequest<{ message: string; importId: string }>({
        method: "POST",
        url: "/import/excel",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier", "import-history"] });
    },
  });
}
