"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, PackageX, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceProductOffers } from "@/features/marketplace/hooks/use-marketplace";
import { useCartStore } from "@/stores/cart-store";

export default function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const offers = useMarketplaceProductOffers(productId);
  const addLine = useCartStore((state) => state.addLine);
  const product = offers.data?.[0];

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href="/pharmacy/marketplace"
      >
        <ArrowLeft className="size-4" />
        Back to marketplace
      </Link>
      <PageHeader
        title={product?.name ?? "Product offers"}
        description={
          product
            ? `${product.manufacturer} · ${product.sku}`
            : "Compare currently available organization-scoped offers."
        }
      />

      <div className="mt-6 space-y-3">
        {offers.isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-32" key={index} />
            ))
          : null}
        {!offers.isLoading && offers.data?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <PackageX className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No active offers are currently available for this product.
              </p>
            </CardContent>
          </Card>
        ) : null}
        {offers.data?.map((offer) => (
          <Card key={offer.id}>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{offer.supplierName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {offer.offerType === "SUPPLIER"
                    ? "Verified supplier offer"
                    : "Pharmacy marketplace offer"}
                </p>
              </div>
              <Badge
                variant={
                  offer.stockStatus === "in_stock"
                    ? "success"
                    : offer.stockStatus === "low_stock"
                      ? "warning"
                      : "danger"
                }
              >
                {offer.stock} available
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Unit price</p>
                  <p className="text-lg font-semibold">${offer.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Minimum order</p>
                  <p className="font-semibold">{offer.moq}</p>
                </div>
              </div>
              <Button
                disabled={offer.stockStatus === "out_of_stock"}
                onClick={() => {
                  addLine({
                    productId: offer.productId,
                    supplierProductId:
                      offer.offerType === "SUPPLIER" ? offer.id : undefined,
                    marketplaceOfferId:
                      offer.offerType === "PHARMACY" ? offer.id : undefined,
                    supplierId: offer.supplierId,
                    supplierName: offer.supplierName,
                    productName: offer.name,
                    unitPrice: offer.price,
                    quantity: offer.moq,
                    moq: offer.moq,
                    maxStock: offer.stock,
                  });
                  toast.success(`${offer.name} added to cart.`);
                }}
              >
                <ShoppingCart className="size-4" />
                Add offer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
