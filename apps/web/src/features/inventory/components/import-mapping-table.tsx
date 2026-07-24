"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TH, THead, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductSearchSelect } from "./product-search-select";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import {
  useCommitInventoryImport,
  useCreateProductRequest,
} from "../hooks/use-import";
import { toast } from "sonner";

export interface InventorySpreadsheetRow extends Record<string, unknown> {
  _id: string;
  productId?: string;
}

interface MappingTableProps {
  rows: InventorySpreadsheetRow[];
  onBack: () => void;
  onSuccess: () => void;
}

function textValue(row: InventorySpreadsheetRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function numberValue(row: InventorySpreadsheetRow, ...keys: string[]) {
  const raw = textValue(row, ...keys);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ImportMappingTable({ rows, onBack, onSuccess }: MappingTableProps) {
  const [mappedRows, setMappedRows] = useState<Record<string, string>>({});
  const [conflictStrategy, setConflictStrategy] = useState<"SKIP" | "UPDATE">("UPDATE");
  const [requestedRows, setRequestedRows] = useState<Set<string>>(new Set());
  const { mutateAsync: commitImport, isPending } = useCommitInventoryImport();
  const createProductRequest = useCreateProductRequest();

  const handleMapProduct = (rowId: string, productId: string) => {
    setMappedRows(prev => ({ ...prev, [rowId]: productId }));
  };

  const handleCommit = async () => {
    const normalizedRows = rows.map((r) => {
      const productId = mappedRows[r._id] || r.productId;
      return { ...r, productId };
    });
    const readyRows = normalizedRows.filter(
      (row): row is InventorySpreadsheetRow & { productId: string } =>
        typeof row.productId === "string" && row.productId.length > 0
    );
    const requestableRows = normalizedRows.filter(
      (row) =>
        !row.productId &&
        !requestedRows.has(row._id) &&
        Boolean(
          textValue(
            row,
            "TradeName",
            "Trade Name",
            "tradeName",
            "Product",
            "product"
          )
        )
    );
    const incompleteRows = readyRows.filter(
      (row) =>
        !textValue(row, "BatchNumber", "Batch Number", "batchNumber") ||
        !textValue(row, "ExpiryDate", "Expiry Date", "expiryDate")
    );
    if (incompleteRows.length > 0) {
      toast.error(
        `${incompleteRows.length} mapped row(s) are missing a batch number or expiry date. No values were invented.`
      );
      return;
    }

    try {
      if (requestableRows.length > 0) {
        await Promise.all(
          requestableRows.map((row) =>
            createProductRequest.mutateAsync({
              brandName:
                textValue(
                  row,
                  "TradeName",
                  "Trade Name",
                  "tradeName",
                  "Product",
                  "product"
                ) ?? "Unknown product",
              genericName: textValue(row, "GenericName", "Generic Name", "genericName"),
              manufacturer: textValue(row, "Manufacturer", "manufacturer"),
              dosageForm: textValue(row, "DosageForm", "Dosage Form", "dosageForm"),
              strength: textValue(row, "Strength", "strength"),
              packageSize: textValue(row, "PackageSize", "Package Size", "packageSize"),
              barcode: textValue(row, "Barcode", "barcode"),
              notes: `Submitted from pharmacy inventory import row ${row._id}`,
            })
          )
        );
        setRequestedRows((current) => {
          const next = new Set(current);
          requestableRows.forEach((row) => next.add(row._id));
          return next;
        });
        toast.success(
          `${requestableRows.length} unmatched product request(s) sent for Admin review.`
        );
      }

      if (readyRows.length === 0) {
        if (requestableRows.length === 0) {
          toast.error("Map a product or provide a product name before continuing.");
        }
        return;
      }

      const payloadRows = readyRows.map((r) => ({
        rowId: r._id,
        productId: r.productId,
        batchNumber: textValue(r, "BatchNumber", "Batch Number", "batchNumber")!,
        expiryDate: textValue(r, "ExpiryDate", "Expiry Date", "expiryDate")!,
        quantity: numberValue(r, "Quantity", "quantity"),
        purchaseCost: numberValue(r, "PurchaseCost", "Purchase Cost", "purchaseCost"),
        sellingPrice: textValue(r, "SellingPrice", "Selling Price", "sellingPrice")
          ? numberValue(r, "SellingPrice", "Selling Price", "sellingPrice")
          : undefined,
        minStock: textValue(r, "MinStock", "Min Stock", "minStock")
          ? numberValue(r, "MinStock", "Min Stock", "minStock")
          : undefined,
        location: textValue(r, "Location", "location"),
      }));

      await commitImport({
        clientMutationId: crypto.randomUUID(),
        conflictStrategy,
        rows: payloadRows,
      });

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to commit import.");
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
            <select
              className="h-9 rounded-full border border-border bg-background px-3 text-sm"
              value={conflictStrategy}
              onChange={(event) =>
                setConflictStrategy(event.target.value as "SKIP" | "UPDATE")
              }
            >
              <option value="UPDATE">Update Stock</option>
              <option value="SKIP">Skip Row</option>
            </select>
          </div>
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            <ArrowLeft className="size-4 mr-2" /> Back
          </Button>
          <Button
            onClick={handleCommit}
            disabled={isPending || createProductRequest.isPending || rows.length === 0}
          >
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
                const isRequested = requestedRows.has(row._id);
                return (
                  <TR key={row._id} className={!isMapped ? "bg-red-50/50" : ""}>
                    <TD>
                      {isMapped ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="size-3 mr-1" /> Ready
                        </Badge>
                      ) : isRequested ? (
                        <Badge variant="warning">Admin review</Badge>
                      ) : (
                        <Badge variant="danger" className="bg-red-100 text-red-800 border-red-200">
                          <AlertCircle className="size-3 mr-1" /> Unmapped
                        </Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="font-medium text-sm">
                        {textValue(row, "TradeName", "Trade Name", "tradeName") || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {textValue(row, "Barcode", "barcode") || ""}
                      </div>
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
                      <div className="text-sm">
                        {textValue(row, "BatchNumber", "Batch Number", "batchNumber") || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {textValue(row, "ExpiryDate", "Expiry Date", "expiryDate") || "-"}
                      </div>
                    </TD>
                    <TD>{numberValue(row, "Quantity", "quantity")}</TD>
                    <TD>${numberValue(row, "PurchaseCost", "Purchase Cost", "purchaseCost")}</TD>
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
