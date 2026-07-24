import { apiRequest } from "@/lib/http-client";
import type { ReportDefinition, DirectExportQueryDto } from "./reports.types";

export const reportsRepository = {
  getCatalog() {
    return apiRequest<ReportDefinition[]>({ method: "GET", url: "/reports/catalog" });
  },
  async downloadDirectExport(reportType: string, query: DirectExportQueryDto) {
    const res = await apiRequest<Blob>({
      method: "GET",
      url: `/reports/${reportType}/export`,
      params: query as any,
      responseType: "blob",
    });
    return res;
  },
};
