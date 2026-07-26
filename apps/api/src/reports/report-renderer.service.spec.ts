import { ReportExportFormat, ReportLocale, ReportType } from '@prisma/client';
import * as XLSX from 'xlsx';
import { ReportRendererService } from './report-renderer.service';
import { ReportResult } from './report.types';

describe('ReportRendererService', () => {
  const service = new ReportRendererService();
  const report: ReportResult = {
    reportType: ReportType.PHARMACY_POS_SALES,
    titleAr: 'مبيعات الصيدلية',
    titleEn: 'Pharmacy sales',
    generatedAt: new Date('2026-07-24T12:00:00.000Z'),
    columns: [
      {
        key: 'product',
        labelAr: 'المنتج',
        labelEn: 'Product',
        type: 'text',
      },
      {
        key: 'total',
        labelAr: 'الإجمالي',
        labelEn: 'Total',
        type: 'money',
      },
    ],
    rows: [
      { product: 'باراسيتامول', total: 1250.5 },
      { product: 'Amoxicillin', total: 850 },
    ],
    summary: { salesCount: 2, netSales: 2100.5 },
  };

  it('creates a readable Excel workbook with localized RTL sheets', async () => {
    const file = await service.render(
      report,
      ReportExportFormat.XLSX,
      ReportLocale.AR,
    );

    expect(file.contentType).toContain('spreadsheetml');
    expect(file.buffer.subarray(0, 2).toString()).toBe('PK');
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    expect(workbook.SheetNames).toEqual(['البيانات', 'الملخص']);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets['البيانات'], {
      header: 1,
    });
    expect(rows[0]).toEqual(['المنتج', 'الإجمالي']);
    expect(rows[1]).toEqual(['باراسيتامول', 1250.5]);
  });

  it.each([ReportLocale.EN, ReportLocale.AR])(
    'creates a valid %s PDF with the bundled Unicode font',
    async (locale) => {
      const file = await service.render(report, ReportExportFormat.PDF, locale);

      expect(file.contentType).toBe('application/pdf');
      expect(file.buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(file.buffer.length).toBeGreaterThan(5000);
    },
  );
});
