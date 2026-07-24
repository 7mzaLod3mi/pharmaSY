import { apiRequest } from "@/lib/http-client";
import type {
  CreateReportExportInput,
  DirectExportQueryDto,
  ReportDefinition,
  ReportExportJob,
  ReportExportPage,
  SignedReportDownload,
} from "./reports.types";

export const reportsRepository = {
  getCatalog() {
    return apiRequest<ReportDefinition[]>({ method: "GET", url: "/reports/catalog" });
  },
  async downloadDirectExport(reportType: string, query: DirectExportQueryDto) {
    const res = await apiRequest<Blob>({
      method: "GET",
      url: `/reports/${reportType}/export`,
      params: query,
      responseType: "blob",
    });
    return res;
  },
  createExport(input: CreateReportExportInput) {
    return apiRequest<ReportExportJob>({
      method: "POST",
      url: "/reports/exports",
      data: input,
    });
  },
  listExports(page = 1, limit = 20) {
    return apiRequest<ReportExportPage>({
      method: "GET",
      url: "/reports/exports",
      params: { page, limit },
    });
  },
  getExport(id: string) {
    return apiRequest<ReportExportJob>({
      method: "GET",
      url: `/reports/exports/${id}`,
    });
  },
  retryExport(id: string) {
    return apiRequest<ReportExportJob>({
      method: "POST",
      url: `/reports/exports/${id}/retry`,
    });
  },
  getDownload(id: string) {
    return apiRequest<SignedReportDownload>({
      method: "GET",
      url: `/reports/exports/${id}/download`,
    });
  },
};
