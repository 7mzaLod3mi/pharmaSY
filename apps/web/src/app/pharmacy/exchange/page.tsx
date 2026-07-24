"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, PackageX, MapPin, CalendarClock } from "lucide-react";
import { useExchangeListings } from "@/features/exchange/hooks/use-exchange";
import { CreateListingDialog } from "@/features/exchange/components/create-listing-dialog";
import type { ExchangeListingStatus } from "@/features/exchange/api/exchange.types";

const statusMap: Record<ExchangeListingStatus, { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral" }> = {
  active: { label: "Active", variant: "success" },
  pending_review: { label: "Pending review", variant: "warning" },
  paused: { label: "Paused", variant: "neutral" },
  sold: { label: "Sold", variant: "info" },
  expired: { label: "Expired", variant: "danger" },
  rejected: { label: "Rejected", variant: "danger" },
};

export default function ExchangeMarketplacePage() {
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: listings, isLoading } = useExchangeListings({
    search: search || undefined,
    mineOnly: tab === "mine",
  });

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Sara Ahmad">
      <PageHeader
        title="Exchange marketplace"
        description="Buy and sell slow-moving or surplus stock directly with other pharmacies."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Create listing
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="browse">Browse listings</TabsTrigger>
            <TabsTrigger value="mine">My listings</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product…"
            className="ps-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      )}

      {!isLoading && listings?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border py-16 text-center">
          <PackageX className="size-6 text-muted-foreground/60" />
          <p className="text-[13.5px] text-muted-foreground">
            {tab === "mine" ? "You haven't listed anything yet." : "No listings match your search."}
          </p>
        </div>
      )}

      {!isLoading && listings && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Card key={l.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14.5px] font-semibold leading-snug">{l.productName}</h3>
                <Badge variant={statusMap[l.status].variant} dot>
                  {statusMap[l.status].label}
                </Badge>
              </div>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Batch {l.batchNumber}</p>

              <div className="mt-3 space-y-1.5 text-[12.5px] text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {l.city} · {l.sellerPharmacyName}
                </p>
                <p className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" />
                  Expires {new Date(l.expiryDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge variant="neutral">{l.availableQuantity} available</Badge>
                {l.reservedQuantity > 0 && <Badge variant="warning">{l.reservedQuantity} reserved</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-[16px] font-semibold text-foreground">${l.price.toFixed(2)}</span>
                <Button size="sm" disabled={l.availableQuantity === 0}>
                  {tab === "mine" ? "Manage" : "Purchase"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateListingDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </DashboardShell>
  );
}
