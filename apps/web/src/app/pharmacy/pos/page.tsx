"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { useInventoryProducts } from "@/features/inventory/hooks/use-inventory";
import { usePosCartStore } from "@/features/pos/store/pos-cart.store";
import { useCreateSale } from "@/features/pos/hooks/use-pos";
import { toast } from "sonner";
import Link from "next/link";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { normalizeApiError } from "@/lib/http-client";
import type { PosPaymentDto } from "@/features/pos/api/pos.types";

interface PaymentDraft {
  id: string;
  method: PosPaymentDto["method"];
  amount: string;
  reference: string;
}

export default function PointOfSalePage() {
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<PaymentDraft[]>([
    { id: crypto.randomUUID(), method: "CASH", amount: "", reference: "" },
  ]);
  
  const { data: products, isLoading } = useInventoryProducts();
  const cart = usePosCartStore();
  const createSale = useCreateSale();

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const subtotal = cart.lines.reduce((acc, line) => acc + (line.unitPrice * line.quantity) - line.discount, 0);
  const discountAmount = cart.globalDiscount.type === "PERCENTAGE" 
    ? subtotal * (cart.globalDiscount.value / 100)
    : cart.globalDiscount.value;
  const total = Math.max(0, subtotal - discountAmount);
  const paymentTotal = payments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );
  const change = Math.max(0, paymentTotal - total);

  const updatePayment = (id: string, patch: Partial<PaymentDraft>) => {
    setPayments((current) =>
      current.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment))
    );
  };

  const handleCheckout = () => {
    if (cart.lines.length === 0) return;
    
    const preparedPayments = payments
      .map((payment, index) => ({
        method: payment.method,
        amount:
          Number(payment.amount) ||
          (payments.length === 1 && index === 0 && payment.method === "CASH" ? total : 0),
        reference: payment.reference.trim() || undefined,
      }))
      .filter((payment) => payment.amount > 0);

    createSale.mutate({
      items: cart.lines.map(l => ({
        productId: l.product.id,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineDiscountAmount: l.discount || undefined,
      })),
      discount: cart.globalDiscount.value > 0 ? cart.globalDiscount : undefined,
      payments: preparedPayments,
      customerName: cart.customerName || undefined,
      customerPhone: cart.customerPhone || undefined,
      notes: cart.notes || undefined,
      clientMutationId: crypto.randomUUID(),
      deviceId: getOrCreateDeviceId(),
      clientCreatedAt: new Date().toISOString(),
    }, {
      onSuccess: () => {
        toast.success("Sale completed successfully");
        cart.clear();
        setPayments([
          { id: crypto.randomUUID(), method: "CASH", amount: "", reference: "" },
        ]);
      },
      onError: (error: unknown) => {
        toast.error(normalizeApiError(error).message);
      }
    });
  };

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col gap-6 xl:h-[calc(100vh-theme(spacing.16))] xl:flex-row">
        
        {/* Left Side: Product Search & Grid */}
        <div className="flex-1 flex flex-col h-full overflow-hidden pt-6 pb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            <Button variant="outline" asChild>
              <Link href="/pharmacy/pos/history">Sales History</Link>
            </Button>
          </div>
          
          <div className="relative mb-6 shrink-0">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              className="ps-9 h-12 text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Search className="size-12 mb-4 opacity-20" />
                <p>No products found matching &quot;{search}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {filteredProducts.map(p => {
                  const outOfStock = p.availableQuantity <= 0;
                  const price = p.sellingPrice;
                  const missingPrice = price === undefined;
                  
                  return (
                    <Card 
                      key={p.id}
                      className={`transition-colors ${
                        outOfStock || missingPrice
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:border-brand-500"
                      }`}
                      onClick={() => {
                        if (outOfStock || missingPrice) return;
                        cart.addLine(p, 1, price);
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium line-clamp-2" title={p.name}>{p.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-xs text-muted-foreground mb-2">{p.sku}</div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-700">
                            {missingPrice ? "Price required" : `$${price.toFixed(2)}`}
                          </span>
                          <span className="text-xs">{p.availableQuantity} in stock</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart Register */}
        <div className="flex h-auto w-full shrink-0 flex-col border-t border-border bg-card px-4 pb-6 pt-6 shadow-sm xl:h-full xl:w-[420px] xl:border-l xl:border-t-0">
          <div className="flex items-center gap-2 mb-4 px-2">
            <ShoppingCart className="size-5" />
            <h2 className="font-semibold text-lg">Current Sale</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-4">
            {cart.lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingCart className="size-12 opacity-20 mb-4" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.lines.map(line => (
                <div key={line.product.id} className="bg-muted/50 p-3 rounded-lg border border-border/50 flex flex-col gap-2">
                  <div className="flex justify-between font-medium text-sm">
                    <span className="line-clamp-1 flex-1 pr-2">{line.product.name}</span>
                    <span>${((line.quantity * line.unitPrice) - line.discount).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">${line.unitPrice.toFixed(2)} / ea</span>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-7 h-7 w-7" 
                        onClick={() => cart.setQuantity(line.product.id, line.quantity - 1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <Input 
                        value={line.quantity} 
                        onChange={(e) => cart.setQuantity(line.product.id, parseInt(e.target.value) || 1)}
                        className="w-12 h-7 text-center text-xs p-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-7 h-7 w-7"
                        onClick={() => cart.setQuantity(line.product.id, line.quantity + 1)}
                        disabled={line.quantity >= line.product.availableQuantity}
                      >
                        <Plus className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 h-7 w-7 ml-1 text-destructive"
                        onClick={() => cart.removeLine(line.product.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Line discount</span>
                    <Input
                      aria-label={`Discount for ${line.product.name}`}
                      className="h-7 w-24 text-xs"
                      max={line.quantity * line.unitPrice}
                      min={0}
                      step="0.01"
                      type="number"
                      value={line.discount}
                      onChange={(event) =>
                        cart.setLineDiscount(
                          line.product.id,
                          Math.min(
                            line.quantity * line.unitPrice,
                            Math.max(0, Number(event.target.value) || 0)
                          )
                        )
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border px-2 space-y-3 shrink-0">
            <div className="space-y-1">
              <Input 
                placeholder="Customer Name (Optional)" 
                value={cart.customerName || ""}
                onChange={(e) => cart.setCustomer(e.target.value, cart.customerPhone)}
                className="h-9"
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Sale discount type"
                  className="h-8 rounded-full border border-border bg-background px-2 text-xs"
                  value={cart.globalDiscount.type}
                  onChange={(event) =>
                    cart.setGlobalDiscount(
                      event.target.value as "PERCENTAGE" | "FIXED_AMOUNT",
                      cart.globalDiscount.value
                    )
                  }
                >
                  <option value="FIXED_AMOUNT">Fixed</option>
                  <option value="PERCENTAGE">Percent</option>
                </select>
                <Input
                  aria-label="Sale discount value"
                  className="h-8 w-20 text-xs"
                  min={0}
                  step="0.01"
                  type="number"
                  value={cart.globalDiscount.value}
                  onChange={(event) =>
                    cart.setGlobalDiscount(
                      cart.globalDiscount.type,
                      Math.max(0, Number(event.target.value) || 0)
                    )
                  }
                />
                {discountAmount > 0 ? (
                  <span className="text-danger-600">-${discountAmount.toFixed(2)}</span>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payments</span>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setPayments((current) => [
                      ...current,
                      { id: crypto.randomUUID(), method: "CARD", amount: "", reference: "" },
                    ])
                  }
                >
                  <Plus className="size-3" />
                  Add
                </Button>
              </div>
              {payments.map((payment) => (
                <div className="grid grid-cols-[92px_1fr_auto] gap-2" key={payment.id}>
                  <select
                    aria-label="Payment method"
                    className="h-9 rounded-full border border-border bg-background px-2 text-xs"
                    value={payment.method}
                    onChange={(event) =>
                      updatePayment(payment.id, {
                        method: event.target.value as PosPaymentDto["method"],
                      })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="MOBILE_WALLET">Mobile wallet</option>
                    <option value="CREDIT">Credit</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <Input
                    aria-label="Payment amount"
                    className="h-9"
                    min={0}
                    placeholder={
                      payments.length === 1 && payment.method === "CASH"
                        ? total.toFixed(2)
                        : "0.00"
                    }
                    step="0.01"
                    type="number"
                    value={payment.amount}
                    onChange={(event) =>
                      updatePayment(payment.id, { amount: event.target.value })
                    }
                  />
                  <Button
                    aria-label="Remove payment"
                    disabled={payments.length === 1}
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setPayments((current) =>
                        current.filter((candidate) => candidate.id !== payment.id)
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  {payment.method !== "CASH" ? (
                    <Input
                      aria-label="Payment reference"
                      className="col-span-3 h-8"
                      placeholder="Payment reference"
                      value={payment.reference}
                      onChange={(event) =>
                        updatePayment(payment.id, { reference: event.target.value })
                      }
                    />
                  ) : null}
                </div>
              ))}
              {paymentTotal > 0 ? (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tendered ${paymentTotal.toFixed(2)}</span>
                  <span>Change ${change.toFixed(2)}</span>
                </div>
              ) : null}
            </div>
            
            <div className="flex justify-between items-end border-t border-border pt-3 mt-3">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-3xl text-brand-700">${total.toFixed(2)}</span>
            </div>
            
            <Button 
              size="lg" 
              className="w-full mt-4 h-14 text-lg" 
              onClick={handleCheckout}
              disabled={cart.lines.length === 0 || createSale.isPending}
            >
              {createSale.isPending ? <Loader2 className="mr-2 animate-spin" /> : "Charge"} 
              {!createSale.isPending && ` $${total.toFixed(2)}`}
            </Button>
            
            {cart.lines.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => cart.clear()}
                disabled={createSale.isPending}
              >
                Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
