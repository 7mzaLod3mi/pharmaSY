"use client";

import { use } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { supplierNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { useSupplierOrderDetails, useUpdateSupplierOrderStatus } from "@/features/supplier-orders/hooks/use-supplier-orders";
import { nextSupplierOrderStatus, type SupplierOrderStatus } from "@/features/supplier-orders/api/supplier-orders.types";
import Link from "next/link";
import { normalizeApiError } from "@/lib/http-client";

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
  shipped: "Awaiting pharmacy receipt",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function SupplierOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useSupplierOrderDetails(id);
  const updateStatus = useUpdateSupplierOrderStatus();

  if (isLoading) {
    return (
      <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Supplier">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!order) {
    return (
      <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Supplier">
        <PageHeader title="Order not found" />
      </DashboardShell>
    );
  }

  const oStatus = order.status.toLowerCase() as SupplierOrderStatus;
  const next = nextSupplierOrderStatus[oStatus];

  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Supplier">
      <div className="mb-4">
        <Link href="/supplier/orders" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to orders
        </Link>
      </div>
      
      <PageHeader
        title={`Order ${order.orderNumber || order.id.slice(0, 8)}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleString()} by ${order.pharmacy?.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" /> Print Invoice
            </Button>
            {next && (
              <Button
                onClick={() => {
                  updateStatus.mutate(
                    { id: order.id, status: next },
                    {
                      onSuccess: () => toast.success(`Order marked as ${next}`),
                      onError: (error) =>
                        toast.error(normalizeApiError(error).message),
                    }
                  );
                }}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "Updating..." : actionLabel[oStatus]}
              </Button>
            )}
            {["pending", "confirmed", "processing"].includes(oStatus) && (
              <Button
                variant="danger"
                onClick={() => {
                  const label = oStatus === "pending" ? "reject" : "cancel";
                  if (!window.confirm(`Are you sure you want to ${label} this order?`)) {
                    return;
                  }
                  updateStatus.mutate(
                    { id: order.id, status: "cancelled" },
                    {
                      onSuccess: () =>
                        toast.success(
                          oStatus === "pending" ? "Order rejected" : "Order cancelled"
                        ),
                      onError: (error) =>
                        toast.error(normalizeApiError(error).message),
                    }
                  );
                }}
                disabled={updateStatus.isPending}
              >
                {oStatus === "pending" ? "Reject order" : "Cancel order"}
              </Button>
            )}
            {oStatus === "shipped" && (
              <Badge variant="info">Awaiting pharmacy receipt confirmation</Badge>
            )}
          </>
        }
      />

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH>Unit Price</TH>
                    <TH>Qty</TH>
                    <TH className="text-right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {order.items?.map((item) => {
                    const product =
                      item.supplierProduct?.product ??
                      item.marketplaceOffer?.product;
                    return (
                    <TR key={item.id}>
                      <TD>
                        <div className="font-medium">{product?.tradeNameAr || "Product"}</div>
                        <div className="text-xs text-muted-foreground">{product?.tradeNameEn}</div>
                      </TD>
                      <TD>${Number(item.unitPrice).toFixed(2)}</TD>
                      <TD>{item.quantity}</TD>
                      <TD className="text-right font-medium">
                        ${Number(item.subtotal).toFixed(2)}
                      </TD>
                    </TR>
                    );
                  })}
                  <TR>
                    <TD colSpan={3} className="text-right font-medium">
                      Subtotal
                    </TD>
                    <TD className="text-right font-bold">
                      ${Number(order.totalAmount).toFixed(2)}
                    </TD>
                  </TR>
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[oStatus]} className="text-sm px-3 py-1">
                  {oStatus.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Pharmacy</p>
                <p className="font-medium">{order.pharmacy?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact</p>
                <p>{order.pharmacy?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Address</p>
                <p>{order.pharmacy?.address || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
