"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalMovementsPage() {
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', 'global', page],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/movements', { params: { page, limit: 20 } });
      return res.data;
    }
  });

  const movements = data?.data || [];
  const meta = data?.meta;

  const getMovementColor = (type: string) => {
    switch(type) {
      case 'PURCHASE': return 'bg-blue-100 text-blue-800';
      case 'SALE': return 'bg-green-100 text-green-800';
      case 'MANUAL_ADJUSTMENT': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
      case 'DAMAGED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Stock Movements"
        description="A complete history of all inventory additions, sales, and adjustments across your pharmacy."
      />

      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Product</TH>
                <TH>Batch</TH>
                <TH>Type</TH>
                <TH>Difference</TH>
                <TH>Reason / User</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR><TD colSpan={6} className="text-center py-6 text-muted-foreground">Loading movements...</TD></TR>
              ) : movements.length === 0 ? (
                <TR><TD colSpan={6} className="text-center py-6 text-muted-foreground">No stock movements found.</TD></TR>
              ) : (
                movements.map((movement: any) => (
                  <TR key={movement.id}>
                    <TD className="text-sm">
                      {new Date(movement.createdAt).toLocaleString()}
                    </TD>
                    <TD>
                      <div className="font-medium text-sm">{movement.inventory?.product?.tradeNameEn}</div>
                    </TD>
                    <TD className="text-sm text-muted-foreground">{movement.batchNumber}</TD>
                    <TD>
                      <Badge variant="outline" className={getMovementColor(movement.type)}>
                        {movement.type.replace('_', ' ')}
                      </Badge>
                    </TD>
                    <TD>
                      <span className={movement.difference > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {movement.difference > 0 ? '+' : ''}{movement.difference}
                      </span>
                    </TD>
                    <TD>
                      <div className="text-sm">{movement.reason || '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        {movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : 'System'}
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && meta.totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!meta.hasPrevPage} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
