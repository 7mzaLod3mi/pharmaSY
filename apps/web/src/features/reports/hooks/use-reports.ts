"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsRepository } from "../api/reports.repository";

export function useReportCatalog() {
  return useQuery({
    queryKey: ["reports", "catalog"],
    queryFn: () => reportsRepository.getCatalog(),
  });
}
