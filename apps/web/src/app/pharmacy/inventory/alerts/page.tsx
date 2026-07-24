"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { useLowStockAlerts, useExpiryAlerts } from "@/features/inventory/hooks/use-inventory";

export default function InventoryAlertsPage() {
  const { data: lowStock, isLoading: loadingLowStock } = useLowStockAlerts();
  const { data: expiry, isLoading: loadingExpiry } = useExpiryAlerts();

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Inventory Alerts"
        description="Monitor low stock items and nearing expiry batches."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="size-5 text-warning-600" />
              <CardTitle>Low Stock Alerts</CardTitle>
            </div>
            <CardDescription>Items that have fallen below their minimum stock threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Available</TH>
                  <TH>Threshold</TH>
                </TR>
              </THead>
              <TBody>
                {loadingLowStock && (
                  <TR><TD colSpan={3}><Skeleton className="h-5 w-full" /></TD></TR>
                )}
                {!loadingLowStock && lowStock?.length === 0 && (
                  <TR><TD colSpan={3} className="text-center py-6 text-muted-foreground">No low stock items.</TD></TR>
                )}
                {!loadingLowStock && lowStock?.map((item) => (
                  <TR key={item.productId}>
                    <TD className="font-medium">{item.productName}</TD>
                    <TD className="font-bold text-warning-600">{item.totalAvailable}</TD>
                    <TD className="text-muted-foreground">{item.minStock}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-danger-600" />
              <CardTitle>Expiry Alerts</CardTitle>
            </div>
            <CardDescription>Batches that will expire within the next 90 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Batch Number</TH>
                  <TH>Expiry Date</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {loadingExpiry && (
                  <TR><TD colSpan={4}><Skeleton className="h-5 w-full" /></TD></TR>
                )}
                {!loadingExpiry && expiry?.length === 0 && (
                  <TR><TD colSpan={4} className="text-center py-6 text-muted-foreground">No near expiry batches.</TD></TR>
                )}
                {!loadingExpiry && expiry?.map((batch) => {
                  const isExpired = new Date(batch.expiryDate).getTime() < Date.now();
                  return (
                    <TR key={batch.id}>
                      <TD className="font-medium">{batch.product?.tradeNameAr || "Product"}</TD>
                      <TD>{batch.batchNumber}</TD>
                      <TD>{new Date(batch.expiryDate).toLocaleDateString()}</TD>
                      <TD>
                        <Badge variant={isExpired ? "danger" : "warning"} dot>
                          {isExpired ? "Expired" : "Expiring soon"}
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
