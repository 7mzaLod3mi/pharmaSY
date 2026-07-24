"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { ProductCard } from "@/components/shared/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, PackageX } from "lucide-react";
import { useMarketplaceCategories, useMarketplaceProducts } from "@/features/marketplace/hooks/use-marketplace";
import { useCartStore } from "@/stores/cart-store";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const { data: categories } = useMarketplaceCategories();
  const { data: products, isLoading } = useMarketplaceProducts({ search, categoryId });
  const addLine = useCartStore((s) => s.addLine);

  const stockLabel = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock" } as const;

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Sara Ahmad">
      <PageHeader
        title="Marketplace"
        description="Browse verified suppliers and build your next order."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products or suppliers…"
            className="ps-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary">
          <SlidersHorizontal className="size-4" /> Filters
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryId(undefined)}
          className={
            !categoryId
              ? "cursor-pointer rounded-full bg-brand-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors duration-200"
              : "cursor-pointer rounded-full border border-border-strong px-3.5 py-1.5 text-[13px] font-medium text-foreground/70 transition-colors duration-200 hover:bg-black/[0.03]"
          }
        >
          All categories
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={
              categoryId === c.id
                ? "cursor-pointer rounded-full bg-brand-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors duration-200"
                : "cursor-pointer rounded-full border border-border-strong px-3.5 py-1.5 text-[13px] font-medium text-foreground/70 transition-colors duration-200 hover:bg-black/[0.03]"
            }
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px]" />
          ))}
        </div>
      )}

      {!isLoading && products?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border py-16 text-center">
          <PackageX className="size-6 text-muted-foreground/60" />
          <p className="text-[13.5px] text-muted-foreground">No products match your search.</p>
        </div>
      )}

      {!isLoading && products && products.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              title={p.name}
              description={`${p.manufacturer} · ${p.supplierName} · MOQ ${p.moq} · ${stockLabel[p.stockStatus]}`}
              price={`$${p.price.toFixed(2)}`}
              onAdd={() => {
                addLine({
                  productId: p.productId,
                  supplierProductId: p.offerType === "SUPPLIER" ? p.id : undefined,
                  marketplaceOfferId: p.offerType === "PHARMACY" ? p.id : undefined,
                  supplierId: p.supplierId,
                  supplierName: p.supplierName,
                  productName: p.name,
                  unitPrice: p.price,
                  quantity: p.moq,
                  moq: p.moq,
                  maxStock: p.stock,
                });
                toast.success(`Added ${p.name} to cart`);
              }}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
