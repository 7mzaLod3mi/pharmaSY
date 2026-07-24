"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Boxes,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  Store,
  Plus,
} from "lucide-react";

import Link from "next/link";
import { useInventoryOverview, useExpiryAlerts } from "@/features/inventory/hooks/use-inventory";
import { useOrders } from "@/features/orders/hooks/use-orders";

const statusVariant = {
  processing: "info",
  delivered: "success",
  pending: "warning",
  confirmed: "info",
  shipped: "info",
  cancelled: "danger",
} as const;

export default function PharmacyDashboardPage() {
  const { data: inventory } = useInventoryOverview();
  const { data: expiryAlerts, isLoading: expiryLoading } = useExpiryAlerts(30);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  
  const recentOrders = orders?.slice(0, 5);

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening across your pharmacy today."
        actions={
          <Button asChild>
            <Link href="/pharmacy/marketplace"><Store className="size-4 mr-2" /> Browse marketplace</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open orders" value={orders?.filter(o => o.status === 'pending').length.toString() || "0"} animatedValue={orders?.filter(o => o.status === 'pending').length || 0} icon={ClipboardList} />
        <StatCard label="Inventory value" value={`$${inventory?.totalInventoryValue?.toLocaleString() || "0"}`} animatedValue={inventory?.totalInventoryValue || 0} format="currency" icon={Boxes} />
        <StatCard label="Expiry alerts" value={`${inventory?.nearExpiryCount || 0} SKUs`} animatedValue={inventory?.nearExpiryCount || 0} suffix=" SKUs" icon={AlertTriangle} />
        <StatCard label="Monthly spend" value="$0" animatedValue={0} format="currency" icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Your latest purchase orders across all suppliers</CardDescription>
            </div>
            <Button variant="secondary" size="sm">
              View all <ArrowUpRight className="size-3.5" />
            </Button>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Order</TH>
                <TH>Supplier</TH>
                <TH>Items</TH>
                <TH>Total</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {ordersLoading ? (
                <TR><TD colSpan={5} className="text-center py-4 text-muted-foreground">Loading orders...</TD></TR>
              ) : recentOrders?.length === 0 ? (
                <TR><TD colSpan={5} className="text-center py-4 text-muted-foreground">No recent orders found.</TD></TR>
              ) : recentOrders?.map((o: any) => (
                <TR key={o.id}>
                  <TD className="font-medium">{o.orderNumber || o.id.slice(0, 8)}</TD>
                  <TD className="text-muted-foreground">{o.supplierName}</TD>
                  <TD className="text-muted-foreground">{o.itemCount}</TD>
                  <TD>${Number(o.total).toFixed(2)}</TD>
                  <TD>
                    <Badge variant={statusVariant[o.status as keyof typeof statusVariant] || 'info'} dot>
                      {o.status}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiry alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiryLoading ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : expiryAlerts?.slice(0, 3).map((item: any) => {
              const diffTime = Math.max(0, new Date(item.expiryDate).getTime() - Date.now());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-[13.5px] font-medium">{item.productNameAr || item.product?.tradeNameAr || "Product"}</p>
                  <p className="text-[12px] text-muted-foreground">Expires in {diffDays} days</p>
                </div>
                <Badge variant={diffDays <= 0 ? "danger" : "warning"}>{diffDays <= 0 ? "Expired" : "Act soon"}</Badge>
              </div>
            )})}
            <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
              <Link href="/pharmacy/marketplace"><Plus className="size-4 mr-2" /> Purchase stock</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
