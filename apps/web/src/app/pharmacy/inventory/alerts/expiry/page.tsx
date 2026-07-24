"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useExpiryAlerts } from "@/features/inventory/hooks/use-inventory";

export default function ExpiryAlertsPage() {
  const { data: alerts, isLoading } = useExpiryAlerts(90);

  const getStatus = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    if (days < 0) return { label: 'Expired', variant: 'danger' as const };
    if (days <= 30) return { label: 'Expires soon', variant: 'warning' as const };
    return { label: 'Expires < 90 days', variant: 'info' as const };
  };

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Expiry Alerts"
        description="Batches that are expired or expiring within the next 90 days."
      />

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Batch Number</TH>
                <TH>Expiry Date</TH>
                <TH>Quantity Remaining</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR><TD colSpan={5} className="text-center py-6 text-muted-foreground">Loading alerts...</TD></TR>
              ) : !alerts || alerts.length === 0 ? (
                <TR><TD colSpan={5} className="text-center py-6 text-muted-foreground">No expiring batches found.</TD></TR>
              ) : (
                alerts.map((batch) => {
                  const status = getStatus(batch.expiryDate);
                  return (
                    <TR key={batch.id}>
                      <TD>
                        <div className="font-medium text-sm">{batch.product?.tradeNameEn}</div>
                        <div className="text-xs text-muted-foreground">{batch.product?.barcode}</div>
                      </TD>
                      <TD className="text-sm font-medium">{batch.batchNumber}</TD>
                      <TD className="text-sm">{new Date(batch.expiryDate).toLocaleDateString()}</TD>
                      <TD>{batch.quantity - batch.reservedStock}</TD>
                      <TD>
                        <Badge variant={status.variant} dot>{status.label}</Badge>
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
