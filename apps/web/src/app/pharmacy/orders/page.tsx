"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, Eye, PackageX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOrders } from "@/features/orders/hooks/use-orders";
import type { OrderStatus } from "@/features/orders/api/orders.types";

const statusVariant: Record<OrderStatus, "info" | "success" | "warning" | "danger"> = {
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  pending: "warning",
  cancelled: "danger",
};

export default function PharmacyOrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useOrders({
    status: tab === "all" ? undefined : tab,
    search: search || undefined,
  });

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Sara Ahmad">
      <PageHeader
        title="Orders"
        description="Track every purchase order placed with your suppliers."
        actions={
          <Button variant="secondary">
            <Download className="size-4" /> Export
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search order ID or supplier…"
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground">{orders?.length ?? 0} orders</p>
        </div>
        <Table className="border-0">
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Supplier</TH>
              <TH>Date</TH>
              <TH>Items</TH>
              <TH>Total</TH>
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

            {!isLoading && orders?.length === 0 && (
              <TR>
                <TD colSpan={7} className="py-10 text-center text-muted-foreground">
                  <PackageX className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  No orders match this filter.
                </TD>
              </TR>
            )}

            {!isLoading &&
              orders?.map((o) => (
                <TR 
                  key={o.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/pharmacy/orders/${o.id}`)}
                >
                  <TD className="font-medium">{o.orderNumber ?? o.id}</TD>
                  <TD className="text-muted-foreground">{o.supplierName}</TD>
                  <TD className="text-muted-foreground">
                    {new Date(o.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TD>
                  <TD className="text-muted-foreground">{o.itemCount}</TD>
                  <TD>${o.total.toFixed(2)}</TD>
                  <TD>
                    <Badge variant={statusVariant[o.status]} dot>
                      {o.status}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/pharmacy/orders/${o.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-[12.5px] text-muted-foreground">Showing {orders?.length ?? 0} of {orders?.length ?? 0}</p>
          <div className="flex gap-1.5">
            <Button variant="secondary" size="sm">Previous</Button>
            <Button variant="secondary" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </DashboardShell>
  );
}
