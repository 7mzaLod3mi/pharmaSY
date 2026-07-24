"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui/table";
import Link from "next/link";
import { Package, Plus, Search, Edit2, Trash2 } from "lucide-react";
import {
  useAdminProducts,
  useDeleteProduct,
} from "@/features/admin-catalog/hooks/use-admin-catalog";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminProducts({ search, limit: 50 });
  const deleteProduct = useDeleteProduct();

  const products = data?.data || [];

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Admin">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Master Catalog"
          description="Manage the central dictionary of all verified pharmaceutical products."
        />
        <Button className="shrink-0 gap-2">
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>SKU</TH>
                <TH>Category</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading products...
                  </TD>
                </TR>
              ) : products?.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                    No products found.
                  </TD>
                </TR>
              ) : (
                products?.map((p: any) => (
                  <TR key={p.id}>
                    <TD>
                      <div className="font-medium text-sm">{p.tradeNameEn}</div>
                      <div className="text-xs text-muted-foreground">{p.tradeNameAr}</div>
                    </TD>
                    <TD className="font-mono text-xs text-muted-foreground">
                      {p.sku || "-"}
                    </TD>
                    <TD className="text-sm text-muted-foreground">
                      {p.category?.nameEn || "-"}
                    </TD>
                    <TD>
                      <Badge variant={p.status === "ACTIVE" ? "success" : p.status === "DRAFT" ? "neutral" : "warning"}>
                        {p.status}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" asChild>
                          <Link href={`/admin/products/${p.id}`}>
                            <Edit2 className="size-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-danger hover:text-danger/80"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this product?")) {
                              deleteProduct.mutate(p.id, {
                                onSuccess: () => toast.success("Product deleted successfully")
                              });
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
              </TBody>
            </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
