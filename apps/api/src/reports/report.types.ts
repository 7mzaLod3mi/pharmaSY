import { ReportType } from '@prisma/client';

export type ReportCell = string | number | boolean | Date | null;
export type ReportColumnType = 'text' | 'number' | 'money' | 'date' | 'status';

export interface ReportColumn {
  key: string;
  labelAr: string;
  labelEn: string;
  type: ReportColumnType;
}

export interface ReportResult {
  reportType: ReportType;
  titleAr: string;
  titleEn: string;
  generatedAt: Date;
  columns: ReportColumn[];
  rows: Array<Record<string, ReportCell>>;
  summary: Record<string, number | string>;
}

export interface ReportFile {
  buffer: Buffer;
  contentType: string;
  extension: 'xlsx' | 'pdf';
}
