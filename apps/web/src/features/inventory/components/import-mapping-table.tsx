"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TH, THead, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductSearchSelect } from "./product-search-select";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useCommitInventoryImport } from "../hooks/use-import";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MappingTableProps {
  rows: any[];
  onBack: () => void;
  onSuccess: () => void;
}

export function ImportMappingTable({ rows, onBack, onSuccess }: MappingTableProps) {
  const [mappedRows, setMappedRows] = useState<Record<string, string>>({});
  const [conflictStrategy, setConflictStrategy] = useState<"SKIP" | "UPDATE">("UPDATE");
  const { mutateAsync: commitImport, isPending } = useCommitInventoryImport();

  const handleMapProduct = (rowId: string, productId: string) => {
    setMappedRows(prev => ({ ...prev, [rowId]: productId }));
  };

  const handleCommit = async () => {
    // Filter out rows that are not mapped
    const readyRows = rows.map(r => {
      const productId = mappedRows[r._id] || r.productId; // if it already had a valid productId
      return { ...r, productId };
    }).filter(r => !!r.productId);

    if (readyRows.length === 0) {
      toast.error("Please map at least one product before committing.");
      return;
    }

    try {
      // transform Excel columns to DTO
      const payloadRows = readyRows.map(r => ({
        rowId: r._id,
        productId: r.productId,
        batchNumber: r.BatchNumber || r['Batch Number'] || r.batchNumber,
        expiryDate: r.ExpiryDate || r['Expiry Date'] || r.expiryDate,
        quantity: Number(r.Quantity || r.quantity || 0),
        purchaseCost: Number(r.PurchaseCost || r['Purchase Cost'] || r.purchaseCost || 0),
        sellingPrice: r.SellingPrice || r['Selling Price'] || r.sellingPrice ? Number(r.SellingPrice || r['Selling Price'] || r.sellingPrice) : undefined,
        minStock: r.MinStock || r['Min Stock'] || r.minStock ? Number(r.MinStock || r['Min Stock'] || r.minStock) : undefined,
        location: r.Location || r.location,
      }));

      await commitImport({
        clientMutationId: `import-${Date.now()}`,
        conflictStrategy,
        rows: payloadRows,
      });

      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to commit import.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Map Unknown Products</CardTitle>
          <CardDescription>
            {Object.keys(mappedRows).length} of {rows.length} rows mapped. Unknown medicines must be explicitly mapped or they will be skipped.
          </CardDescription>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 text-sm">
            <span>Duplicate action:</span>
            <Select value={conflictStrategy} onValueChange={(val: "SKIP" | "UPDATE") => setConflictStrategy(val)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPDATE">Update Stock</SelectItem>
                <SelectItem value="SKIP">Skip Row</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            <ArrowLeft className="size-4 mr-2" /> Back
          </Button>
          <Button onClick={handleCommit} disabled={isPending || Object.keys(mappedRows).length === 0}>
            {isPending ? "Committing..." : "Commit Import"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto max-h-[600px] relative">
          <Table>
            <THead className="sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
              <TR>
                <TH>Status</TH>
                <TH>Product Data (Excel)</TH>
                <TH>Match in Master Catalog</TH>
                <TH>Batch & Expiry</TH>
                <TH>Qty</TH>
                <TH>Cost</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => {
                const isMapped = !!mappedRows[row._id] || !!row.productId;
                return (
                  <TR key={row._id} className={!isMapped ? "bg-red-50/50" : ""}>
                    <TD>
                      {isMapped ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="size-3 mr-1" /> Ready
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="bg-red-100 text-red-800 border-red-200">
                          <AlertCircle className="size-3 mr-1" /> Unmapped
                        </Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="font-medium text-sm">{row.TradeName || row['Trade Name'] || row.tradeName || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{row.Barcode || row.barcode || ''}</div>
                    </TD>
                    <TD className="w-[300px]">
                      {row.productId ? (
                         <div className="text-sm font-medium text-green-700">Pre-matched (ID: {row.productId.slice(0, 8)})</div>
                      ) : (
                         <ProductSearchSelect 
                           value={mappedRows[row._id]} 
                           onChange={(val) => handleMapProduct(row._id, val)}
                           placeholder="Search master catalog..."
                         />
                      )}
                    </TD>
                    <TD>
                      <div className="text-sm">{row.BatchNumber || row['Batch Number'] || row.batchNumber || '-'}</div>
                      <div className="text-xs text-muted-foreground">{row.ExpiryDate || row['Expiry Date'] || row.expiryDate || '-'}</div>
                    </TD>
                    <TD>{row.Quantity || row.quantity || 0}</TD>
                    <TD>${row.PurchaseCost || row['Purchase Cost'] || row.purchaseCost || 0}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
