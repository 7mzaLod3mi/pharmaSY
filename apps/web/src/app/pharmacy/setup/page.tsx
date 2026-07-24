"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { UploadCloud, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as xlsx from "xlsx";
import { toast } from "sonner";
import {
  ImportMappingTable,
  type InventorySpreadsheetRow,
} from "@/features/inventory/components/import-mapping-table";
import { useRouter } from "next/navigation";

type SetupStep = "UPLOAD" | "MAPPING" | "COMPLETED";

export default function PharmacySetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("UPLOAD");
  const [parsedData, setParsedData] = useState<InventorySpreadsheetRow[]>([]);

  const downloadTemplate = () => {
    const template =
      "TradeName,GenericName,Barcode,BatchNumber,ExpiryDate,Quantity,PurchaseCost,SellingPrice,MinStock,Location\n";
    const url = URL.createObjectURL(
      new Blob([template], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pharmasy_inventory_template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
        
        if (rows.length === 0) {
          toast.error("The uploaded file is empty.");
          return;
        }

        // Basic formula injection protection (sanitize rows)
        const sanitizedRows: InventorySpreadsheetRow[] = rows.map((row, index) => {
          const cleanRow: InventorySpreadsheetRow = { _id: `row-${index}` };
          Object.keys(row).forEach(key => {
            let val: unknown = row[key];
            if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
              val = `'${val}`; // neutralize formula
            }
            cleanRow[key] = val;
          });
          return cleanRow;
        });

        setParsedData(sanitizedRows);
        setStep("MAPPING");
      } catch {
        toast.error("Failed to parse the Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB limit
  });

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Pharmacy Setup"
        description="Initialize your pharmacy by importing your existing inventory or adding products manually."
      />

      <div className="max-w-5xl mx-auto mt-6">
        {step === "UPLOAD" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Inventory (Excel / CSV)</CardTitle>
                <CardDescription>Upload a spreadsheet containing your current stock to automatically populate your inventory.</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className="size-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">Drag & drop your file here</h3>
                  <p className="text-sm text-muted-foreground mb-4">Supports .xlsx, .xls, .csv up to 5MB</p>
                  <Button variant="outline">Browse Files</Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileSpreadsheet className="size-4 mr-2" />
                  <button
                    className="text-primary hover:underline"
                    type="button"
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </button>
                </div>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Entry</CardTitle>
                  <CardDescription>Skip bulk import and add products one by one.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you don&apos;t have an Excel file or prefer to start fresh, you can manually search the master catalog and add batches individually.
                  </p>
                  <Button variant="secondary" onClick={() => router.push('/pharmacy/inventory')}>
                    Go to Inventory
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === "MAPPING" && (
          <ImportMappingTable 
            rows={parsedData} 
            onBack={() => setStep("UPLOAD")} 
            onSuccess={() => setStep("COMPLETED")} 
          />
        )}

        {step === "COMPLETED" && (
          <Card className="text-center py-12">
            <CardContent>
              <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your inventory has been successfully imported and matched against the master catalog.
              </p>
              <Button onClick={() => router.push('/pharmacy/inventory')}>
                View My Inventory
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
