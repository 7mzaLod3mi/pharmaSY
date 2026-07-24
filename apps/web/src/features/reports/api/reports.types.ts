export interface ReportDefinition {
  type: string;
  name: string;
  description: string;
  formats: string[];
}

export interface DirectExportQueryDto {
  format: "excel" | "pdf";
  locale?: string;
  from?: string;
  to?: string;
  limit?: number;
}
