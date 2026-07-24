"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileClock,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavSection } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeApiError } from "@/lib/http-client";
import { useLocale } from "@/lib/i18n";
import { reportsRepository } from "../api/reports.repository";
import type {
  ReportDefinition,
  ReportExportFormat,
  ReportExportJob,
} from "../api/reports.types";
import {
  useCreateReportExport,
  useReportCatalog,
  useReportExports,
  useRetryReportExport,
} from "../hooks/use-reports";

interface ReportCenterProps {
  sections: NavSection[];
  roleLabel: string;
}

const copy = {
  en: {
    title: "Reports & exports",
    description: "Generate organization-scoped operational reports and private downloads.",
    from: "From",
    to: "To",
    direct: "Quick",
    queued: "Large",
    history: "Export history",
    empty: "No exports have been requested yet.",
    rows: "rows",
    retry: "Retry",
    download: "Download",
    expired: "This private download has expired. Retry the export to create a new file.",
    started: "Export request queued.",
    downloadStarted: "Download started.",
  },
  ar: {
    title: "التقارير والتصدير",
    description: "إنشاء تقارير خاصة بمؤسستك وتنزيلها عبر روابط خاصة وآمنة.",
    from: "من تاريخ",
    to: "إلى تاريخ",
    direct: "سريع",
    queued: "كبير",
    history: "سجل ملفات التصدير",
    empty: "لم يتم طلب أي ملف تصدير بعد.",
    rows: "سجل",
    retry: "إعادة المحاولة",
    download: "تنزيل",
    expired: "انتهت صلاحية رابط التنزيل الخاص. أعد المحاولة لإنشاء ملف جديد.",
    started: "تم وضع طلب التصدير في قائمة المعالجة.",
    downloadStarted: "بدأ التنزيل.",
  },
} as const;

function endOfDay(date: string) {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function startOfDay(date: string) {
  return new Date(`${date}T00:00:00.000`).toISOString();
}

function jobVariant(status: ReportExportJob["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "FAILED" || status === "EXPIRED") return "danger" as const;
  return "warning" as const;
}

export function ReportCenter({ sections, roleLabel }: ReportCenterProps) {
  const { locale } = useLocale();
  const text = copy[locale];
  const catalog = useReportCatalog();
  const exportsQuery = useReportExports();
  const createExport = useCreateReportExport();
  const retryExport = useRetryReportExport();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
    [now]
  );
  const [fromDate, setFromDate] = useState(monthStart.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10));
  const filters = { from: startOfDay(fromDate), to: endOfDay(toDate) };

  const directDownload = async (
    report: ReportDefinition,
    format: ReportExportFormat
  ) => {
    const action = `${report.reportType}-${format}-direct`;
    try {
      setActiveAction(action);
      const blob = await reportsRepository.downloadDirectExport(report.reportType, {
        ...filters,
        format,
        locale: locale.toUpperCase() as "AR" | "EN",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${report.reportType}_${fromDate}_${toDate}.${format === "XLSX" ? "xlsx" : "pdf"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(text.downloadStarted);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setActiveAction(null);
    }
  };

  const queueExport = async (
    report: ReportDefinition,
    format: ReportExportFormat
  ) => {
    const action = `${report.reportType}-${format}-queue`;
    try {
      setActiveAction(action);
      await createExport.mutateAsync({
        reportType: report.reportType,
        format,
        locale: locale.toUpperCase() as "AR" | "EN",
        filters,
        clientRequestId: crypto.randomUUID(),
      });
      toast.success(text.started);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setActiveAction(null);
    }
  };

  const downloadJob = async (job: ReportExportJob) => {
    try {
      setActiveAction(`${job.id}-download`);
      const signed = await reportsRepository.getDownload(job.id);
      window.location.assign(signed.url);
    } catch (error) {
      const normalized = normalizeApiError(error);
      toast.error(normalized.status === 410 ? text.expired : normalized.message);
      exportsQuery.refetch();
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <DashboardShell sections={sections} roleLabel={roleLabel} userName={roleLabel}>
      <PageHeader title={text.title} description={text.description} />

      <div className="mt-6 flex flex-wrap gap-4 rounded-xl border border-border bg-muted/30 p-4">
        <label className="min-w-52 space-y-1.5 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            {text.from}
          </span>
          <Input
            max={toDate}
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </label>
        <label className="min-w-52 space-y-1.5 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            {text.to}
          </span>
          <Input
            min={fromDate}
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {catalog.isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-48" key={index} />
            ))
          : catalog.data?.map((report) => {
              const title = locale === "ar" ? report.titleAr : report.titleEn;
              return (
                <Card className="flex flex-col" key={report.reportType}>
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                      {report.reportType.replaceAll("_", " ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(["XLSX", "PDF"] as const).map((format) => (
                        <Button
                          disabled={activeAction !== null}
                          key={format}
                          variant="outline"
                          onClick={() => directDownload(report, format)}
                        >
                          {activeAction === `${report.reportType}-${format}-direct` ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : format === "XLSX" ? (
                            <FileSpreadsheet className="size-4" />
                          ) : (
                            <FileText className="size-4" />
                          )}
                          {text.direct} {format}
                        </Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["XLSX", "PDF"] as const).map((format) => (
                        <Button
                          disabled={activeAction !== null}
                          key={format}
                          variant="ghost"
                          onClick={() => queueExport(report, format)}
                        >
                          <FileClock className="size-4" />
                          {text.queued} {format}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{text.history}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exportsQuery.isLoading ? <Skeleton className="h-20" /> : null}
          {!exportsQuery.isLoading && exportsQuery.data?.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{text.empty}</p>
          ) : null}
          {exportsQuery.data?.data.map((job) => (
            <div
              className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              key={job.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{job.reportType.replaceAll("_", " ")}</p>
                  <Badge variant={jobVariant(job.status)}>{job.status}</Badge>
                  <Badge variant="neutral">{job.format}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString(locale)}
                  {job.rowCount !== null && job.rowCount !== undefined
                    ? ` · ${job.rowCount} ${text.rows}`
                    : ""}
                  {job.status === "PROCESSING" ? ` · ${job.progress}%` : ""}
                </p>
                {job.errorMessage ? (
                  <p className="mt-1 text-xs text-danger-600">{job.errorMessage}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {job.status === "COMPLETED" ? (
                  <Button
                    disabled={activeAction !== null}
                    size="sm"
                    onClick={() => downloadJob(job)}
                  >
                    {activeAction === `${job.id}-download` ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {text.download}
                  </Button>
                ) : null}
                {job.status === "FAILED" || job.status === "EXPIRED" ? (
                  <Button
                    disabled={retryExport.isPending}
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      retryExport
                        .mutateAsync(job.id)
                        .catch((error) =>
                          toast.error(normalizeApiError(error).message)
                        )
                    }
                  >
                    <RefreshCw className="size-4" />
                    {text.retry}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
