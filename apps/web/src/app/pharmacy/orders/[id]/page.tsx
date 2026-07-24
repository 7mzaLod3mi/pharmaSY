"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
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
import { Loader2, ArrowLeft, Printer, Ban } from "lucide-react";
import { useOrderDetails, useCancelOrder } from "@/features/orders/hooks/use-orders";
import type { OrderStatus } from "@/features/orders/api/orders.types";
import { normalizeApiError } from "@/lib/http-client";

const statusVariant: Record<OrderStatus, "info" | "success" | "warning" | "danger"> = {
  confirmed: "info",
  processing: "info",
  shipped: "info",
  delivered: "success",
  pending: "warning",
  cancelled: "danger",
};

export default function PharmacyOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrderDetails(id);
  const cancelOrder = useCancelOrder();

  if (isLoading) {
    return (
      <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!order) {
    return (
      <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
        <PageHeader title="Order not found" />
      </DashboardShell>
    );
  }

  const oStatus = order.status.toLowerCase() as OrderStatus;
  const canCancel = oStatus === "pending" || oStatus === "confirmed";

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrder.mutate(id, {
        onSuccess: () => toast.success("Order cancelled successfully"),
        onError: (error: unknown) =>
          toast.error(normalizeApiError(error).message),
      });
    }
  };

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <div className="mb-4">
        <Link href="/pharmacy/orders" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to orders
        </Link>
      </div>
      
      <PageHeader
        title={`Order ${order.orderNumber || order.id.slice(0, 8)}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleString()} with ${order.supplier?.name}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" /> Print Invoice
            </Button>
            {canCancel && (
              <Button 
                variant="danger" 
                onClick={handleCancel}
                disabled={cancelOrder.isPending}
              >
                {cancelOrder.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Ban className="mr-2 size-4" />}
                {cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
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
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Supplier</p>
                <p className="font-medium">{order.supplier?.name || "Marketplace Seller"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
