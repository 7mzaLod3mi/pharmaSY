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

const recentOrders = [
  { id: "PO-4821", supplier: "Nova Pharma", items: 14, total: "$2,140.00", status: "processing" as const },
  { id: "PO-4820", supplier: "MedCore Distribution", items: 6, total: "$860.50", status: "delivered" as const },
  { id: "PO-4819", supplier: "Vitalis Supply", items: 22, total: "$3,412.00", status: "pending" as const },
  { id: "PO-4818", supplier: "Al-Shifa Group", items: 3, total: "$210.00", status: "delivered" as const },
];

const statusVariant = {
  processing: "info",
  delivered: "success",
  pending: "warning",
} as const;

export default function PharmacyDashboardPage() {
  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Sara Ahmad">
      <PageHeader
        title="Dashboard"
        description="Here's what's happening across your pharmacy today."
        actions={
          <Button>
            <Store className="size-4" /> Browse marketplace
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open orders" value="18" animatedValue={18} delta={{ value: "+4", direction: "up" }} icon={ClipboardList} />
        <StatCard label="Inventory value" value="$84,320" animatedValue={84320} format="currency" delta={{ value: "+2.1%", direction: "up" }} icon={Boxes} />
        <StatCard label="Expiry alerts" value="5 SKUs" animatedValue={5} suffix=" SKUs" delta={{ value: "+2", direction: "up", positive: false }} icon={AlertTriangle} />
        <StatCard label="Monthly spend" value="$21,940" animatedValue={21940} format="currency" delta={{ value: "-6.3%", direction: "down", positive: true }} icon={Wallet} />
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
              {recentOrders.map((o) => (
                <TR key={o.id}>
                  <TD className="font-medium">{o.id}</TD>
                  <TD className="text-muted-foreground">{o.supplier}</TD>
                  <TD className="text-muted-foreground">{o.items}</TD>
                  <TD>{o.total}</TD>
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

        <Card>
          <CardHeader>
            <CardTitle>Expiry alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Amoxicillin 500mg", days: 12 },
              { name: "Insulin Glargine", days: 21 },
              { name: "Paracetamol Syrup", days: 30 },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-[13.5px] font-medium">{item.name}</p>
                  <p className="text-[12px] text-muted-foreground">Expires in {item.days} days</p>
                </div>
                <Badge variant="warning">Act soon</Badge>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full justify-center">
              <Plus className="size-4" /> Create reorder
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
