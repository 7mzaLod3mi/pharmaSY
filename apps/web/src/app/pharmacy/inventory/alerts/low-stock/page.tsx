"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLowStockAlerts } from "@/features/inventory/hooks/use-inventory";

export default function LowStockAlertsPage() {
  const { data: alerts, isLoading } = useLowStockAlerts();

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Low Stock Alerts"
        description="Products that have fallen below their configured minimum stock threshold."
      />

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Current Quantity</TH>
                <TH>Minimum Required</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR><TD colSpan={5} className="text-center py-6 text-muted-foreground">Loading alerts...</TD></TR>
              ) : !alerts || alerts.length === 0 ? (
                <TR><TD colSpan={5} className="text-center py-6 text-muted-foreground">No low stock items found.</TD></TR>
              ) : (
                alerts.map((item: any) => {
                  return (
                    <TR key={item.id}>
                      <TD>
                        <div className="font-medium text-sm">{item.tradeNameEn}</div>
                        <div className="text-xs text-muted-foreground">{item.barcode}</div>
                      </TD>
                      <TD className="text-sm">{item.category?.nameEn || '-'}</TD>
                      <TD className="text-sm font-medium text-red-600">{item.totalQuantity}</TD>
                      <TD>{item.minStockThreshold}</TD>
                      <TD>
                        <Badge variant="danger" dot>Low Stock</Badge>
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
