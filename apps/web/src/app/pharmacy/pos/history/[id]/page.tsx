"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Printer, Ban, RotateCcw } from "lucide-react";
import { usePosSale, useCancelSale, useCreateSaleReturn } from "@/features/pos/hooks/use-pos";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { normalizeApiError } from "@/lib/http-client";
import type {
  PosPaymentDto,
  PosSale,
  PosSaleItem,
} from "@/features/pos/api/pos.types";

function buildRefundPlan(sale: PosSale, amount: number): PosPaymentDto[] {
  let remaining = Math.max(0, amount);
  const refunds: PosPaymentDto[] = [];
  for (const payment of sale.payments.filter(
    (candidate) => candidate.type !== "REFUND"
  )) {
    if (remaining <= 0) break;
    const available = Number(payment.amount);
    const applied = Math.min(available, remaining);
    if (applied > 0) {
      refunds.push({
        method: payment.method,
        amount: Number(applied.toFixed(2)),
        reference: payment.reference ?? undefined,
      });
      remaining = Number((remaining - applied).toFixed(2));
    }
  }
  return refunds;
}

function returnItemValue(item: PosSaleItem, quantity: number) {
  const remainingQuantity = item.quantity - (item.returnedQuantity ?? 0);
  if (remainingQuantity <= 0 || quantity <= 0) return 0;
  const remainingValue = Number(item.netAmount) - Number(item.returnedAmount ?? 0);
  return remainingValue * (quantity / remainingQuantity);
}

export default function PosSaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: sale, isLoading } = usePosSale(id);
  const cancelSale = useCancelSale();
  const returnSale = useCreateSaleReturn();
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

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
  const canReturn =
    sale.status === "COMPLETED" || sale.status === "PARTIALLY_RETURNED";

  const handleCancel = () => {
    const reason = window.prompt("Cancellation reason (required):")?.trim();
    if (reason && reason.length >= 3) {
      const refundable = Math.max(
        0,
        Number(sale.paidAmount) - Number(sale.refundedAmount ?? 0)
      );
      cancelSale.mutate({ id, dto: { 
        reason,
        refunds: buildRefundPlan(sale, refundable),
        clientMutationId: crypto.randomUUID(),
        deviceId: getOrCreateDeviceId(),
        clientCreatedAt: new Date().toISOString(),
      } }, {
        onSuccess: () => toast.success("Sale cancelled successfully"),
        onError: (error: unknown) =>
          toast.error(normalizeApiError(error).message),
      });
    }
  };

  const handleReturn = () => {
    const reason = returnReason.trim();
    const items = sale.items
      .map((item) => ({
        saleItemId: item.id,
        quantity: returnQuantities[item.id] ?? 0,
      }))
      .filter((item) => item.quantity > 0);
    if (reason.length < 3) {
      toast.error("Return reason must contain at least 3 characters.");
      return;
    }
    if (items.length === 0) {
      toast.error("Select at least one quantity to return.");
      return;
    }
    const returnAmount = sale.items.reduce(
      (sum, item) => sum + returnItemValue(item, returnQuantities[item.id] ?? 0),
      0
    );
      const refundableBalance = Math.max(
        0,
        Number(sale.paidAmount) - Number(sale.refundedAmount ?? 0)
      );
      returnSale.mutate({ 
        id, 
        dto: { 
          items,
          reason,
          refunds: buildRefundPlan(
            sale,
            Math.min(returnAmount, refundableBalance)
          ),
          clientMutationId: crypto.randomUUID(),
          deviceId: getOrCreateDeviceId(),
          clientCreatedAt: new Date().toISOString(),
        } 
      }, {
        onSuccess: () => {
          toast.success("Return processed successfully");
          setReturnOpen(false);
          setReturnReason("");
          setReturnQuantities({});
        },
        onError: (error: unknown) =>
          toast.error(normalizeApiError(error).message),
      });
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
                onClick={() => {
                  setReturnQuantities({});
                  setReturnReason("");
                  setReturnOpen(true);
                }}
                disabled={returnSale.isPending}
              >
                {returnSale.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RotateCcw className="mr-2 size-4" />}
                Return Items
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
                  {sale.items?.map((item) => (
                    <TR key={item.id}>
                      <TD>
                        <div className="font-medium">
                          {item.productNameEn || item.productNameAr}
                        </div>
                      </TD>
                      <TD>{item.quantity}</TD>
                      <TD>${Number(item.unitPrice).toFixed(2)}</TD>
                      <TD>${Number(item.lineDiscountAmount || 0).toFixed(2)}</TD>
                      <TD className="text-right font-medium">
                        ${((Number(item.unitPrice) * item.quantity) - Number(item.lineDiscountAmount || 0)).toFixed(2)}
                      </TD>
                    </TR>
                  ))}
                  
                  {Number(sale.discountAmount) > 0 && (
                    <TR>
                      <TD colSpan={4} className="text-right font-medium text-muted-foreground">
                        Global Discount
                      </TD>
                      <TD className="text-right text-danger-600">
                        -${Number(sale.discountAmount).toFixed(2)}
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
                  {sale.payments.map((p) => (
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

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return sale items</DialogTitle>
            <DialogDescription>
              Choose the exact quantities. Returned stock is restored to the original FEFO batches by the server.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {sale.items.map((item) => {
              const remaining = item.quantity - (item.returnedQuantity ?? 0);
              return (
                <div key={item.id} className="grid grid-cols-[1fr_120px] items-center gap-4 rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{item.productNameEn || item.productNameAr}</p>
                    <p className="text-xs text-muted-foreground">
                      {remaining} of {item.quantity} eligible for return
                    </p>
                  </div>
                  <Input
                    aria-label={`Return quantity for ${item.productNameEn || item.productNameAr}`}
                    type="number"
                    min={0}
                    max={remaining}
                    disabled={remaining === 0}
                    value={returnQuantities[item.id] ?? 0}
                    onChange={(event) => {
                      const value = Math.min(remaining, Math.max(0, Number.parseInt(event.target.value, 10) || 0));
                      setReturnQuantities((current) => ({ ...current, [item.id]: value }));
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="return-reason">Return reason</label>
            <textarea
              id="return-reason"
              className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder="Required for the audit trail"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Close</Button>
            <Button onClick={handleReturn} disabled={returnSale.isPending}>
              {returnSale.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirm return
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
