export type ReportType =
  | "PHARMACY_POS_SALES"
  | "PHARMACY_POS_RETURNS"
  | "SUPPLIER_SALES"
  | "C2C_EXCHANGE"
  | "ORDERS_FULFILLMENT"
  | "INVENTORY_VALUE"
  | "INVENTORY_MOVEMENTS"
  | "LOW_STOCK"
  | "EXPIRY"
  | "PRODUCT_CATEGORY_PERFORMANCE";

export type ReportExportFormat = "XLSX" | "PDF";
export type ReportLocale = "AR" | "EN";
export type ReportExportStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export interface ReportDefinition {
  reportType: ReportType;
  titleAr: string;
  titleEn: string;
}

export interface DirectExportQueryDto {
  format: ReportExportFormat;
  locale?: ReportLocale;
  from?: string;
  to?: string;
  limit?: number;
}

export interface CreateReportExportInput {
  reportType: ReportType;
  format: ReportExportFormat;
  locale: ReportLocale;
  filters: Omit<DirectExportQueryDto, "format" | "locale">;
  clientRequestId: string;
}

export interface ReportExportJob {
  id: string;
  reportType: ReportType;
  format: ReportExportFormat;
  locale: ReportLocale;
  status: ReportExportStatus;
  progress: number;
  attempts: number;
  rowCount?: number | null;
  fileName?: string | null;
  errorMessage?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ReportExportPage {
  data: ReportExportJob[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SignedReportDownload {
  url: string;
  expiresIn: number;
}
