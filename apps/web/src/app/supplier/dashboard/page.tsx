"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { supplierNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Users, Package, TrendingUp, ArrowUpRight, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useSupplierOrders } from "@/features/supplier-orders/hooks/use-supplier-orders";
import { useSupplierProducts } from "@/features/supplier-products/hooks/use-supplier-products";

const statusVariant = {
  pending: "warning",
  confirmed: "brand",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
} as const;

export default function SupplierDashboardPage() {
  const orders = useSupplierOrders();
  const products = useSupplierProducts();
  const incomingOrders = orders.data?.slice(0, 5) ?? [];
  const newOrders = orders.data?.filter((order) => order.status === "pending").length ?? 0;
  const activePharmacies = new Set(
    orders.data?.map((order) => order.pharmacyName) ?? []
  ).size;
  const monthlyRevenue =
    orders.data
      ?.filter((order) => {
        const placed = new Date(order.placedAt);
        const now = new Date();
        return (
          order.status !== "cancelled" &&
          placed.getMonth() === now.getMonth() &&
          placed.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, order) => sum + order.total, 0) ?? 0;

  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Supplier">
      <PageHeader
        title="Dashboard"
        description="Track incoming orders and catalog performance."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/supplier/products/import">
            <UploadCloud className="size-4" /> Import products
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New orders" value={String(newOrders)} animatedValue={newOrders} icon={ClipboardList} />
        <StatCard label="Ordering pharmacies" value={String(activePharmacies)} animatedValue={activePharmacies} icon={Users} />
        <StatCard label="Listed products" value={String(products.data?.length ?? 0)} animatedValue={products.data?.length ?? 0} icon={Package} />
        <StatCard label="Monthly revenue" value={`$${monthlyRevenue.toLocaleString()}`} animatedValue={monthlyRevenue} format="currency" icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Incoming orders</CardTitle>
            <CardDescription>Purchase orders placed by pharmacies on the marketplace</CardDescription>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/supplier/orders">
            View all <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Pharmacy</TH>
              <TH>Items</TH>
              <TH>Total</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {orders.isLoading ? (
              <TR>
                <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading orders...
                </TD>
              </TR>
            ) : incomingOrders.length === 0 ? (
              <TR>
                <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                  No incoming orders.
                </TD>
              </TR>
            ) : incomingOrders.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium">{o.orderNumber ?? o.id.slice(0, 8)}</TD>
                <TD className="text-muted-foreground">{o.pharmacyName}</TD>
                <TD className="text-muted-foreground">{o.itemCount}</TD>
                <TD>${o.total.toFixed(2)}</TD>
                <TD>
                  <Badge variant={statusVariant[o.status]} dot>
                    {o.status}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
