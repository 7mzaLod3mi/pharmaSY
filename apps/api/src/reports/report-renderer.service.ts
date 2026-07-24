import { Injectable } from '@nestjs/common';
import { ReportExportFormat, ReportLocale } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { ReportCell, ReportFile, ReportResult } from './report.types';

@Injectable()
export class ReportRendererService {
  async render(
    result: ReportResult,
    format: ReportExportFormat,
    locale: ReportLocale,
  ): Promise<ReportFile> {
    return format === ReportExportFormat.XLSX
      ? this.excel(result, locale)
      : this.pdf(result, locale);
  }

  private excel(result: ReportResult, locale: ReportLocale): ReportFile {
    const isArabic = locale === ReportLocale.AR;
    const headers = result.columns.map((column) =>
      isArabic ? column.labelAr : column.labelEn,
    );
    const values = result.rows.map((row) =>
      result.columns.map((column) =>
        this.excelValue(row[column.key], column.type, locale),
      ),
    );
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...values], {
      cellDates: true,
    });
    worksheet['!cols'] = result.columns.map((column) => ({
      wch: Math.max(
        12,
        Math.min(
          40,
          Math.max(
            isArabic ? column.labelAr.length : column.labelEn.length,
            ...result.rows
              .slice(0, 200)
              .map((row) => String(this.rawValue(row[column.key]) ?? '').length),
          ) + 2,
        ),
      ),
    }));
    if (isArabic) worksheet['!view'] = [{ RTL: true }];

    const summaryRows = Object.entries(result.summary).map(([key, value]) => [
      this.summaryLabel(key, isArabic),
      value,
    ]);
    const summary = XLSX.utils.aoa_to_sheet([
      [isArabic ? result.titleAr : result.titleEn],
      [isArabic ? 'وقت الإنشاء' : 'Generated at', result.generatedAt],
      [],
      [isArabic ? 'المؤشر' : 'Metric', isArabic ? 'القيمة' : 'Value'],
      ...summaryRows,
    ]);
    if (isArabic) summary['!view'] = [{ RTL: true }];
    summary['!cols'] = [{ wch: 34 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isArabic ? 'البيانات' : 'Data');
    XLSX.utils.book_append_sheet(workbook, summary, isArabic ? 'الملخص' : 'Summary');
    workbook.Workbook = { Views: [{ RTL: isArabic }] };
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true,
    }) as Buffer;
    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }

  private async pdf(
    result: ReportResult,
    locale: ReportLocale,
  ): Promise<ReportFile> {
    const isArabic = locale === ReportLocale.AR;
    const document = new PDFDocument({
      size: 'A3',
      layout: 'landscape',
      margin: 36,
      bufferPages: true,
      info: {
        Title: isArabic ? result.titleAr : result.titleEn,
        Author: 'PharmaSY',
        Subject: result.reportType,
      },
    });
    document.registerFont('Noto', this.fontPath());
    document.font('Noto');

    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    const pageWidth = document.page.width;
    const contentWidth =
      pageWidth - document.page.margins.left - document.page.margins.right;
    const title = isArabic ? result.titleAr : result.titleEn;
    document
      .fontSize(20)
      .fillColor('#12372a')
      .text(this.display(title, isArabic), {
        align: isArabic ? 'right' : 'left',
      });
    document
      .moveDown(0.25)
      .fontSize(9)
      .fillColor('#4b5563')
      .text(
        this.display(
          `${isArabic ? 'تم الإنشاء' : 'Generated'}: ${this.date(
            result.generatedAt,
            locale,
          )}`,
          isArabic,
        ),
        { align: isArabic ? 'right' : 'left' },
      );
    document.moveDown(0.8);

    const summaryEntries = Object.entries(result.summary);
    if (summaryEntries.length) {
      const summaryText = summaryEntries
        .map(
          ([key, value]) =>
            `${this.summaryLabel(key, isArabic)}: ${this.formatValue(
              value,
              this.summaryType(key),
              locale,
            )}`,
        )
        .join('    |    ');
      const summaryY = document.y;
      document
        .roundedRect(document.page.margins.left, summaryY, contentWidth, 30, 4)
        .fill('#eef7f2');
      document
        .fillColor('#12372a')
        .fontSize(9)
        .text(
          this.display(summaryText, isArabic),
          document.page.margins.left + 8,
          summaryY + 6,
          {
            width: contentWidth - 16,
            height: 18,
            ellipsis: true,
            align: isArabic ? 'right' : 'left',
          },
        );
      document.y = summaryY + 42;
    }

    const columns = isArabic ? [...result.columns].reverse() : result.columns;
    const columnWidth = contentWidth / Math.max(columns.length, 1);
    const rowHeight = 26;
    const renderHeader = () => {
      const y = document.y;
      document.rect(document.page.margins.left, y, contentWidth, rowHeight).fill('#12372a');
      columns.forEach((column, index) => {
        document
          .fillColor('#ffffff')
          .fontSize(8)
          .text(
            this.display(isArabic ? column.labelAr : column.labelEn, isArabic),
            document.page.margins.left + index * columnWidth + 4,
            y + 7,
            {
              width: columnWidth - 8,
              height: rowHeight - 8,
              ellipsis: true,
              align: isArabic ? 'right' : 'left',
            },
          );
      });
      document.y = y + rowHeight;
    };
    renderHeader();

    result.rows.forEach((row, rowIndex) => {
      if (
        document.y + rowHeight >
        document.page.height - document.page.margins.bottom - 20
      ) {
        document.addPage();
        renderHeader();
      }
      const y = document.y;
      document
        .rect(document.page.margins.left, y, contentWidth, rowHeight)
        .fill(rowIndex % 2 ? '#f8faf9' : '#ffffff');
      columns.forEach((column, index) => {
        const formatted = this.formatValue(row[column.key], column.type, locale);
        document
          .fillColor('#1f2937')
          .fontSize(7.5)
          .text(
            this.display(formatted, isArabic),
            document.page.margins.left + index * columnWidth + 4,
            y + 7,
            {
              width: columnWidth - 8,
              height: rowHeight - 8,
              ellipsis: true,
              align:
                column.type === 'money' || column.type === 'number'
                  ? 'right'
                  : isArabic
                    ? 'right'
                    : 'left',
            },
          );
      });
      document.y = y + rowHeight;
    });

    const range = document.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      document.switchToPage(page);
      document
        .font('Noto')
        .fontSize(8)
        .fillColor('#6b7280')
        .text(
          `${page + 1} / ${range.count}`,
          document.page.margins.left,
          document.page.height - 24,
          { width: contentWidth, align: 'center' },
        );
    }
    document.end();
    return {
      buffer: await completed,
      contentType: 'application/pdf',
      extension: 'pdf',
    };
  }

  private fontPath() {
    const candidates = [
      path.join(process.cwd(), 'assets', 'fonts', 'NotoSansArabic-Variable.ttf'),
      path.join(
        process.cwd(),
        'apps',
        'api',
        'assets',
        'fonts',
        'NotoSansArabic-Variable.ttf',
      ),
      path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansArabic-Variable.ttf'),
    ];
    const found = candidates.find((candidate) => fs.existsSync(candidate));
    if (!found) {
      throw new Error('Bundled Noto Sans Arabic font was not found');
    }
    return found;
  }

  private display(value: string, _isArabic: boolean) {
    return value;
  }

  private summaryLabel(key: string, isArabic: boolean) {
    if (!isArabic) {
      return key
        .replace(/^status_/, 'Status ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/^./, (character) => character.toUpperCase());
    }
    if (key.startsWith('status_')) {
      return `حالة ${key.slice(7).replace(/_/g, ' ')}`;
    }
    return ARABIC_SUMMARY_LABELS[key] ?? key;
  }

  private summaryType(key: string) {
    return /(value|sales|refunds|discounts|revenue|cost|margin)$/i.test(key)
      ? 'money'
      : 'number';
  }

  private formatValue(
    value: ReportCell | number | string,
    type: string,
    locale: ReportLocale,
  ) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date || type === 'date') {
      return this.date(value instanceof Date ? value : new Date(String(value)), locale);
    }
    if (type === 'money') {
      return new Intl.NumberFormat(locale === ReportLocale.AR ? 'ar-SY' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));
    }
    if (type === 'number' && typeof value === 'number') {
      return new Intl.NumberFormat(
        locale === ReportLocale.AR ? 'ar-SY' : 'en-US',
      ).format(value);
    }
    if (type === 'status' && locale === ReportLocale.AR) {
      return ARABIC_STATUS_LABELS[String(value)] ?? String(value);
    }
    return String(value);
  }

  private date(value: Date, locale: ReportLocale) {
    return new Intl.DateTimeFormat(
      locale === ReportLocale.AR ? 'ar-SY' : 'en-GB',
      { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
    ).format(value);
  }

  private rawValue(value: ReportCell) {
    return value instanceof Date ? value : value ?? '';
  }

  private excelValue(
    value: ReportCell,
    type: string,
    locale: ReportLocale,
  ) {
    if (type === 'status' && locale === ReportLocale.AR && value != null) {
      return ARABIC_STATUS_LABELS[String(value)] ?? String(value);
    }
    return this.rawValue(value);
  }
}

const ARABIC_SUMMARY_LABELS: Record<string, string> = {
  saleCount: 'عدد المبيعات',
  grossSales: 'إجمالي المبيعات',
  discounts: 'الخصومات',
  refunds: 'المبالغ المستردة',
  netSales: 'صافي المبيعات',
  returnCount: 'عدد المرتجعات',
  returnedValue: 'قيمة المرتجعات',
  refundedValue: 'القيمة المستردة',
  orderCount: 'عدد الطلبات',
  orderValue: 'قيمة الطلبات',
  deliveredValue: 'قيمة الطلبات المسلّمة',
  transactionCount: 'عدد العمليات',
  salesValue: 'قيمة المبيعات',
  purchasesValue: 'قيمة المشتريات',
  batchCount: 'عدد التشغيلات',
  unitsOnHand: 'الوحدات المتوفرة',
  totalStockValue: 'قيمة المخزون',
  availableStockValue: 'قيمة المخزون المتاح',
  movementCount: 'عدد الحركات',
  inboundUnits: 'الوحدات الداخلة',
  outboundUnits: 'الوحدات الخارجة',
  lowStockProducts: 'منتجات منخفضة المخزون',
  shortageUnits: 'وحدات النقص',
  expiredBatches: 'التشغيلات المنتهية',
  unitsAtRisk: 'الوحدات المعرّضة',
  valueAtRisk: 'القيمة المعرّضة',
  productCount: 'عدد المنتجات',
  units: 'الوحدات',
  revenue: 'الإيرادات',
  cost: 'التكلفة',
  margin: 'الهامش',
};

const ARABIC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد المعالجة',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغى',
  COMPLETED: 'مكتمل',
  PARTIALLY_RETURNED: 'مرتجع جزئيًا',
  RETURNED: 'مرتجع',
  RETURN: 'إرجاع',
  CANCELLATION: 'إلغاء',
  PAID: 'مدفوع',
  UNPAID: 'غير مدفوع',
  PARTIALLY_PAID: 'مدفوع جزئيًا',
  PARTIALLY_REFUNDED: 'مسترد جزئيًا',
  REFUNDED: 'مسترد',
  EXPIRED: 'منتهي الصلاحية',
  EXPIRING: 'قريب الانتهاء',
  SALE: 'بيع',
  PURCHASE: 'شراء',
  SUPPLIER: 'مورّد',
  C2C: 'صيدلية إلى صيدلية',
  POS_SALE: 'بيع نقطة بيع',
  POS_RETURN: 'مرتجع نقطة بيع',
  POS_CANCELLATION: 'إلغاء نقطة بيع',
  ORDER_RECEIVED: 'استلام طلب',
  ORDER_DELIVERED: 'تسليم طلب',
  ADJUSTMENT: 'تسوية مخزون',
  MANUAL_ADD: 'إضافة يدوية',
  MANUAL_REMOVE: 'إزالة يدوية',
  EXPIRED_REMOVAL: 'إزالة منتهي الصلاحية',
  DAMAGED_REMOVAL: 'إزالة تالف',
};
