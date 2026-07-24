"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, FileText, Calendar, Loader2 } from "lucide-react";
import { useReportCatalog } from "@/features/reports/hooks/use-reports";
import { reportsRepository } from "@/features/reports/api/reports.repository";
import { toast } from "sonner";
import { normalizeApiError } from "@/lib/http-client";
import { useLocale } from "@/lib/i18n";
import type { ReportExportFormat } from "@/features/reports/api/reports.types";
import { ReportCenter } from "@/features/reports/components/report-center";

function LegacyPharmacyReportsPage() {
  const { locale } = useLocale();
  const { data: catalog, isLoading } = useReportCatalog();
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fromDate, setFromDate] = useState(firstDay.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  const handleDownload = async (reportType: string, format: ReportExportFormat, reportName: string) => {
    try {
      setDownloading(`${reportType}-${format}`);
      const blob = await reportsRepository.downloadDirectExport(reportType, {
        format,
        locale: locale.toUpperCase() as "AR" | "EN",
        from: new Date(fromDate).toISOString(),
        to: new Date(toDate).toISOString(),
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportName.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.${format === 'XLSX' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Reports & Analytics"
        description="Generate and download financial and inventory reports for your pharmacy."
      />

      <div className="mt-6 mb-8 p-4 bg-muted/30 rounded-lg border border-border flex flex-wrap items-end gap-4">
        <div className="space-y-1.5 flex-1 min-w-[200px] max-w-[300px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" /> Date Range (From)
          </label>
          <Input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px] max-w-[300px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" /> Date Range (To)
          </label>
          <Input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
        
        {!isLoading && catalog?.map((report) => {
          const name = locale === "ar" ? report.titleAr : report.titleEn;
          return (
          <Card key={report.reportType} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {report.reportType.replaceAll("_", " ")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1" />
            <div className="p-6 pt-0 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900"
                  onClick={() => handleDownload(report.reportType, "XLSX", name)}
                  disabled={!!downloading}
                >
                  {downloading === `${report.reportType}-XLSX` ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 size-4" />
                  )}
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900"
                  onClick={() => handleDownload(report.reportType, "PDF", name)}
                  disabled={!!downloading}
                >
                  {downloading === `${report.reportType}-PDF` ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 size-4" />
                  )}
                  PDF
                </Button>
            </div>
          </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}

// Retained temporarily as a direct-download fallback while ReportCenter is the active UI.
void LegacyPharmacyReportsPage;

export default function PharmacyReportsPage() {
  return <ReportCenter sections={pharmacyNav} roleLabel="Pharmacy" />;
}
