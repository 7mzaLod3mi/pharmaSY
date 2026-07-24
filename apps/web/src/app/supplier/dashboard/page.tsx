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

const incomingOrders = [
  { id: "PO-4821", pharmacy: "Care Point Pharmacy", items: 14, total: "$2,140.00", status: "new" as const },
  { id: "PO-4816", pharmacy: "Al-Shifa Branch 3", items: 6, total: "$860.50", status: "confirmed" as const },
  { id: "PO-4809", pharmacy: "MediWell Pharmacy", items: 22, total: "$3,412.00", status: "shipped" as const },
  { id: "PO-4802", pharmacy: "Family Care Pharmacy", items: 3, total: "$210.00", status: "confirmed" as const },
];

const statusVariant = { new: "info", confirmed: "brand", shipped: "success" } as const;

export default function SupplierDashboardPage() {
  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Omar Nasser">
      <PageHeader
        title="Dashboard"
        description="Track incoming orders and catalog performance."
        actions={
          <Button variant="secondary">
            <UploadCloud className="size-4" /> Import products
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New orders" value="9" animatedValue={9} delta={{ value: "+3", direction: "up" }} icon={ClipboardList} />
        <StatCard label="Active pharmacies" value="64" animatedValue={64} delta={{ value: "+5", direction: "up" }} icon={Users} />
        <StatCard label="Listed products" value="1,204" animatedValue={1204} icon={Package} />
        <StatCard label="Monthly revenue" value="$182,400" animatedValue={182400} format="currency" delta={{ value: "+8.4%", direction: "up" }} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Incoming orders</CardTitle>
            <CardDescription>Purchase orders placed by pharmacies on the marketplace</CardDescription>
          </div>
          <Button variant="secondary" size="sm">
            View all <ArrowUpRight className="size-3.5" />
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
            {incomingOrders.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium">{o.id}</TD>
                <TD className="text-muted-foreground">{o.pharmacy}</TD>
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
    </DashboardShell>
  );
}
