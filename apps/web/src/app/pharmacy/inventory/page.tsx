"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Boxes, AlertTriangle, PackageX, TrendingDown, Search, Plus, PackageOpen, LayoutList } from "lucide-react";
import { useInventoryOverview, useInventoryProducts } from "@/features/inventory/hooks/use-inventory";
import { ProductBatchesDialog } from "@/features/inventory/components/product-batches-dialog";
import { useState } from "react";
import Link from "next/link";

function nearestExpiry(batches: { expiryDate: string; status: string }[]) {
  const usable = batches.filter((b) => b.status !== "expired").sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  if (!usable.length) return "—";
  return new Date(usable[0].expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PharmacyInventoryPage() {
  const { data: overview, isLoading: overviewLoading } = useInventoryOverview();
  const { data: products, isLoading: productsLoading } = useInventoryProducts();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Sara Ahmad">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and expiry across your pharmacy — available and reserved quantities are tracked separately, batch by batch."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link href="/pharmacy/inventory/alerts">
                <AlertTriangle className="size-4 mr-2" /> Alerts
              </Link>
            </Button>
            <Button asChild>
              <Link href="/pharmacy/marketplace">
                <Plus className="size-4 mr-2" /> Purchase stock
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewLoading || !overview ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard label="Available stock" animatedValue={overview.availableStockCount} value="" icon={Boxes} />
            <StatCard label="Reserved stock" animatedValue={overview.reservedStockCount} value="" icon={PackageOpen} />
            <StatCard label="Low stock" animatedValue={overview.lowStockCount} value="" icon={TrendingDown} />
            <StatCard label="Near-expiry batches" animatedValue={overview.nearExpiryCount} value="" icon={AlertTriangle} />
          </>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search SKU or product…" className="ps-9" />
          </div>
        </div>
        <Table className="border-0">
          <THead>
            <TR>
              <TH>SKU</TH>
              <TH>Product</TH>
              <TH>Available</TH>
              <TH>Reserved</TH>
              <TH>Total</TH>
              <TH>Nearest expiry</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {productsLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <Skeleton className="h-5 w-full" />
                  </TD>
                </TR>
              ))}

            {!productsLoading && products?.length === 0 && (
              <TR>
                <TD colSpan={7} className="py-10 text-center text-muted-foreground">
                  <PackageX className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  No inventory items yet.
                </TD>
              </TR>
            )}

            {!productsLoading &&
              products?.map((item) => {
                const isOut = item.availableQuantity === 0;
                const isLow = !isOut && item.availableQuantity <= item.lowStockThreshold;
                const status = isOut
                  ? { label: "Out of stock", variant: "danger" as const }
                  : isLow
                    ? { label: "Low stock", variant: "warning" as const }
                    : { label: "Healthy", variant: "success" as const };
                return (
                  <TR key={item.id}>
                    <TD className="font-mono text-[12.5px] text-muted-foreground">{item.sku}</TD>
                    <TD className="font-medium">{item.name}</TD>
                    <TD>{item.availableQuantity}</TD>
                    <TD className="text-muted-foreground">{item.reservedQuantity}</TD>
                    <TD className="text-muted-foreground">{item.totalQuantity}</TD>
                    <TD className="text-muted-foreground">{nearestExpiry(item.batches)}</TD>
                    <TD>
                      <Badge variant={status.variant} dot>
                        {status.label}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(item)}>
                        Manage
                      </Button>
                    </TD>
                  </TR>
                );
              })}
          </TBody>
        </Table>
      </Card>
      
      <ProductBatchesDialog 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </DashboardShell>
  );
}
