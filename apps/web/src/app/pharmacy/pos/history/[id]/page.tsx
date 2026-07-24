"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Loader2, ArrowLeft, Printer, Ban, RotateCcw } from "lucide-react";
import { usePosSale, useCancelSale, useCreateSaleReturn } from "@/features/pos/hooks/use-pos";

export default function PosSaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: sale, isLoading } = usePosSale(id);
  const cancelSale = useCancelSale();
  const returnSale = useCreateSaleReturn();

  if (isLoading) {
    return (
      <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  if (!sale) {
    return (
      <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
        <PageHeader title="Receipt not found" />
      </DashboardShell>
    );
  }

  const canCancel = sale.status === "COMPLETED";
  const canReturn = sale.status === "COMPLETED"; // Ideally, checking if items haven't been returned already

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to completely cancel this sale? This action cannot be undone.")) {
      cancelSale.mutate({ id, dto: { 
        reason: "Cancelled by pharmacy staff",
        clientMutationId: crypto.randomUUID(),
        deviceId: "pos-terminal-1"
      } }, {
        onSuccess: () => toast.success("Sale cancelled successfully"),
        onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Failed to cancel sale"),
      });
    }
  };

  const handleReturnAll = () => {
    if (window.confirm("Process a full return for this sale?")) {
      returnSale.mutate({ 
        id, 
        dto: { 
          items: sale.items.map((i: any) => ({ saleItemId: i.id, quantity: i.quantity })),
          reason: "Full return",
          clientMutationId: crypto.randomUUID(),
          deviceId: "pos-terminal-1"
        } 
      }, {
        onSuccess: () => toast.success("Return processed successfully"),
        onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Failed to process return"),
      });
    }
  };

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <div className="mb-4">
        <Link href="/pharmacy/pos/history" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 size-4" /> Back to history
        </Link>
      </div>
      
      <PageHeader
        title={`Receipt #${sale.id.slice(0, 13).toUpperCase()}`}
        description={`Transaction from ${new Date(sale.createdAt).toLocaleString()}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" /> Print Receipt
            </Button>
            {canReturn && (
              <Button 
                variant="outline" 
                onClick={handleReturnAll}
                disabled={returnSale.isPending}
              >
                {returnSale.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RotateCcw className="mr-2 size-4" />}
                Full Return
              </Button>
            )}
            {canCancel && (
              <Button 
                variant="danger" 
                onClick={handleCancel}
                disabled={cancelSale.isPending}
              >
                {cancelSale.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Ban className="mr-2 size-4" />}
                Cancel Sale
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sale Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Product</TH>
                    <TH>Qty</TH>
                    <TH>Price</TH>
                    <TH>Discount</TH>
                    <TH className="text-right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {sale.items?.map((item: any) => (
                    <TR key={item.id}>
                      <TD>
                        <div className="font-medium">{item.productName || "Product"}</div>
                      </TD>
                      <TD>{item.quantity}</TD>
                      <TD>${Number(item.unitPrice).toFixed(2)}</TD>
                      <TD>${Number(item.lineDiscountAmount || 0).toFixed(2)}</TD>
                      <TD className="text-right font-medium">
                        ${((Number(item.unitPrice) * item.quantity) - Number(item.lineDiscountAmount || 0)).toFixed(2)}
                      </TD>
                    </TR>
                  ))}
                  
                  {Number(sale.globalDiscountAmount) > 0 && (
                    <TR>
                      <TD colSpan={4} className="text-right font-medium text-muted-foreground">
                        Global Discount
                      </TD>
                      <TD className="text-right text-danger-600">
                        -${Number(sale.globalDiscountAmount).toFixed(2)}
                      </TD>
                    </TR>
                  )}
                  
                  <TR>
                    <TD colSpan={4} className="text-right font-medium">
                      Net Total
                    </TD>
                    <TD className="text-right font-bold text-lg">
                      ${Number(sale.totalAmount).toFixed(2)}
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
              <CardTitle>Transaction Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge 
                  variant={sale.status === 'COMPLETED' ? 'success' : sale.status === 'CANCELLED' ? 'danger' : 'warning'}
                  className="mt-1"
                >
                  {sale.status}
                </Badge>
              </div>
              
              <div>
                <p className="text-muted-foreground">Customer Name</p>
                <p className="font-medium">{sale.customerName || "Walk-in"}</p>
              </div>
              
              {sale.customerPhone && (
                <div>
                  <p className="text-muted-foreground">Customer Phone</p>
                  <p className="font-medium">{sale.customerPhone}</p>
                </div>
              )}
              
              <div>
                <p className="text-muted-foreground">Cashier / Staff</p>
                <p className="font-medium">{sale.staffUser?.firstName} {sale.staffUser?.lastName}</p>
              </div>
            </CardContent>
          </Card>
          
          {sale.payments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {sale.payments.map((p: any) => (
                    <li key={p.id} className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <Badge variant="neutral">{p.method}</Badge>
                      </span>
                      <span>${Number(p.amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
