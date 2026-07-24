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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PackageX, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupplierOrders, useUpdateSupplierOrderStatus } from "@/features/supplier-orders/hooks/use-supplier-orders";
import { nextSupplierOrderStatus, type SupplierOrderStatus } from "@/features/supplier-orders/api/supplier-orders.types";

const statusVariant: Record<SupplierOrderStatus, "info" | "brand" | "success" | "danger" | "warning"> = {
  pending: "warning",
  confirmed: "brand",
  processing: "info",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
};

const actionLabel: Record<SupplierOrderStatus, string> = {
  pending: "Confirm order",
  confirmed: "Start processing",
  processing: "Mark shipped",
  shipped: "Mark delivered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function SupplierOrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | SupplierOrderStatus>("all");
  const { data: orders, isLoading } = useSupplierOrders({ status: tab === "all" ? undefined : tab });
  const updateStatus = useUpdateSupplierOrderStatus();

  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Omar Nasser">
      <PageHeader
        title="Orders"
        description="Fulfill purchase orders coming from pharmacies."
        actions={
          <Button variant="secondary">
            <Download className="size-4" /> Export
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All orders</TabsTrigger>
          <TabsTrigger value="pending">New</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <Table className="border-0">
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Pharmacy</TH>
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
                  No orders in this filter.
                </TD>
              </TR>
            )}

            {!isLoading &&
              orders?.map((o) => {
                const next = nextSupplierOrderStatus[o.status];
                return (
                  <TR 
                    key={o.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/supplier/orders/${o.id}`)}
                  >
                    <TD className="font-medium">{o.orderNumber ?? o.id}</TD>
                    <TD className="text-muted-foreground">{o.pharmacyName}</TD>
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
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!next}
                          onClick={() => {
                            if (!next) return;
                            updateStatus.mutate({ id: o.id, status: next });
                            toast.success(`${o.orderNumber ?? o.id} marked as ${next}`);
                          }}
                        >
                          {actionLabel[o.status]}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          onClick={() => router.push(`/supplier/orders/${o.id}`)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
