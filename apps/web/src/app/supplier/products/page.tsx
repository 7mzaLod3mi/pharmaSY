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
import { ProductDialog } from "@/features/supplier-products/components/product-dialog";
import { useSupplierProducts, useRemoveSupplierProduct, useUpsertSupplierProduct } from "@/features/supplier-products/hooks/use-supplier-products";

const statusVariant = {
  active: { label: "Active", variant: "success" as const },
  low_stock: { label: "Low stock", variant: "warning" as const },
  inactive: { label: "Inactive", variant: "neutral" as const },
};

export default function SupplierProductsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const { data: products, isLoading } = useSupplierProducts({ search });
  const removeProduct = useRemoveSupplierProduct();

  const filteredProducts = products || [];

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

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
            <Button onClick={handleAdd}>
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
          <p className="text-[12.5px] text-muted-foreground">{filteredProducts?.length ?? 0} products</p>
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

            {!isLoading && filteredProducts?.length === 0 && (
              <TR>
                <TD colSpan={7} className="py-10 text-center text-muted-foreground">
                  <PackageX className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  No products match your search.
                </TD>
              </TR>
            )}

            {!isLoading &&
              filteredProducts.map((p: any) => (
                <TR key={p.id}>
                  <TD className="font-mono text-[12.5px] text-muted-foreground">{p.sku}</TD>
                  <TD className="font-medium">{p.name}</TD>
                  <TD className="text-muted-foreground">{p.category}</TD>
                  <TD>${p.price.toFixed(2)}</TD>
                  <TD className="text-muted-foreground">{p.moq}</TD>
                  <TD>
                    <Badge variant={statusVariant[p.status as keyof typeof statusVariant]?.variant || 'neutral'} dot>
                      {statusVariant[p.status as keyof typeof statusVariant]?.label || p.status}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        title="Edit product"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-200 hover:bg-black/[0.04] text-muted-foreground hover:text-foreground"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`size-8 ${p.status !== 'inactive' ? 'text-danger hover:text-danger/80' : 'text-success hover:text-success/80'}`}
                        title={p.status !== 'inactive' ? "Mark Unavailable" : "Mark Available"}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to mark this product as ${p.status !== 'inactive' ? 'unavailable' : 'available'}?`)) {
                            toast.info("Toggling availability...");
                          }
                        }}
                      >
                        <Power className="size-3.5" />
                      </Button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to remove this product?")) {
                            removeProduct.mutate(p.id, {
                              onSuccess: () => toast.success("Product removed")
                            });
                          }
                        }}
                        title="Remove product"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-200 hover:bg-destructive/10 text-destructive"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </Card>
      
      <ProductDialog 
        isOpen={dialogOpen} 
        onOpenChange={setDialogOpen} 
        product={selectedProduct} 
      />
    </DashboardShell>
  );
}
