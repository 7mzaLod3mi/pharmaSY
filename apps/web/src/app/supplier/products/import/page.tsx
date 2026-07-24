"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { supplierNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useSupplierImportHistory, useUploadSupplierExcel } from "@/features/supplier-products/hooks/use-import";

export default function SupplierImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const { data: history, isLoading } = useSupplierImportHistory();
  const upload = useUploadSupplierExcel();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: () => {
        toast.success("File uploaded successfully. Processing started.");
        setFile(null);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to upload file.");
      }
    });
  };

  const imports = history || [];

  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Supplier">
      <PageHeader
        title="Import Products"
        description="Upload your product catalog using an Excel spreadsheet."
      />

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Upload Excel</CardTitle>
            <CardDescription>Supported formats: .xlsx, .xls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex w-full items-center justify-center">
              <label
                htmlFor="dropzone-file"
                className="dark:hover:bg-bray-800 flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card hover:bg-muted/50"
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <UploadCloud className="mb-4 h-8 w-8 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
              </label>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="size-4" />
                <span className="truncate">{file.name}</span>
              </div>
            )}
            
            <Button 
              className="w-full" 
              disabled={!file || upload.isPending}
              onClick={handleUpload}
            >
              {upload.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {upload.isPending ? "Uploading..." : "Import Data"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>Track the status of your recent imports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Filename</TH>
                  <TH>Status</TH>
                  <TH>Success / Total</TH>
                  <TH className="hidden md:table-cell">Uploaded By</TH>
                  <TH className="hidden sm:table-cell">Date</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {isLoading ? (
                  <TR>
                    <TD colSpan={6} className="text-center py-6 text-muted-foreground">
                      Loading history...
                    </TD>
                  </TR>
                ) : history?.data.length === 0 ? (
                  <TR>
                    <TD colSpan={6} className="text-center py-8 text-muted-foreground">
                      No import history found.
                    </TD>
                  </TR>
                ) : (
                  history?.data.map((job: any) => (
                    <TR key={job.id}>
                      <TD className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="size-4 text-muted-foreground" />
                          {job.filename}
                        </div>
                      </TD>
                      <TD>
                        <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'neutral'}>
                          {job.status}
                        </Badge>
                      </TD>
                      <TD>
                        <span className="font-medium">{job.processedCount}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span>{job.totalRecords}</span>
                      </TD>
                      <TD className="hidden md:table-cell text-muted-foreground">{job.uploadedBy}</TD>
                      <TD className="hidden sm:table-cell text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </TD>
                      <TD className="text-right">
                        <Button variant="ghost" size="sm">
                          View details
                        </Button>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
