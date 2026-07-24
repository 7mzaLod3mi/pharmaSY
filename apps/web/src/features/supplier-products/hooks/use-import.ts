"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/http-client";
import type { ApiResponse } from "@pharmasyn/types";

export function useSupplierImportHistory() {
  return useQuery({
    queryKey: ["supplier", "import-history"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>("/import/history");
      return res.data;
    },
  });
}

export function useSupplierImportStatus(id: string) {
  return useQuery({
    queryKey: ["supplier", "import-status", id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any>>(`/import/${id}`);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status === "PENDING" || status === "PROCESSING" ? 3000 : false;
    },
  });
}

export function useUploadSupplierExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await apiClient.post<ApiResponse<any>>("/import/excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier", "import-history"] });
    },
  });
}
