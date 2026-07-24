"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { supplierNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, UploadCloud, Power, PackageX } from "lucide-react";
import { useSupplierProducts, useToggleSupplierProductAvailability } from "@/features/supplier-products/hooks/use-supplier-products";

const statusMap = {
  active: { label: "Active", variant: "success" as const },
  low_stock: { label: "Low stock", variant: "warning" as const },
  inactive: { label: "Inactive", variant: "neutral" as const },
};

export default function SupplierProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useSupplierProducts({ search });
  const toggleAvailability = useToggleSupplierProductAvailability();

  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Omar Nasser">
      <PageHeader
        title="Products"
        description="Manage your catalog listed on the PharmaSY marketplace."
        actions={
          <>
            <Button variant="secondary">
              <UploadCloud className="size-4" /> Import Excel
            </Button>
            <Button>
              <Plus className="size-4" /> Add product
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground">{products?.length ?? 0} products</p>
        </div>
        <Table className="border-0">
          <THead>
            <TR>
              <TH>SKU</TH>
              <TH>Product</TH>
              <TH>Category</TH>
              <TH>Price</TH>
              <TH>MOQ</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={7}>
                    <Skeleton className="h-5 w-full" />
                  </TD>
                </TR>
              ))}

            {!isLoading && products?.length === 0 && (
              <TR>
                <TD colSpan={7} className="py-10 text-center text-muted-foreground">
                  <PackageX className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  No products match your search.
                </TD>
              </TR>
            )}

            {!isLoading &&
              products?.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono text-[12.5px] text-muted-foreground">{p.sku}</TD>
                  <TD className="font-medium">{p.name}</TD>
                  <TD className="text-muted-foreground">{p.category}</TD>
                  <TD>${p.price.toFixed(2)}</TD>
                  <TD className="text-muted-foreground">{p.moq}</TD>
                  <TD>
                    <Badge variant={statusMap[p.status].variant} dot>
                      {statusMap[p.status].label}
                    </Badge>
                  </TD>
                  <TD>
                    <button
                      onClick={() => {
                        toggleAvailability.mutate(p.id);
                        toast.success(p.status === "inactive" ? `${p.name} is now active` : `${p.name} deactivated`);
                      }}
                      title={p.status === "inactive" ? "Activate" : "Deactivate"}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-200 hover:bg-black/[0.04]"
                    >
                      <Power className={p.status === "inactive" ? "size-3.5 text-muted-foreground" : "size-3.5 text-success-600"} />
                    </button>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
