"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, ArrowRight, Package } from "lucide-react";
import { useCartStore, groupCartBySupplier } from "@/stores/cart-store";
import { apiClient } from "@/lib/http-client";

export default function CartPage() {
  const router = useRouter();
  const { lines, setQuantity, removeLine, clear } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const groups = Array.from(groupCartBySupplier(lines).entries());
  const totalAmount = lines.reduce((acc, line) => acc + line.unitPrice * line.quantity, 0);

  const handleCheckout = async () => {
    if (lines.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      const payload = {
        groups: groups.map(([supplierId, items]) => ({
          supplierId,
          items: items.map(i => ({
            supplierProductId: i.supplierProductId,
            marketplaceOfferId: i.marketplaceOfferId,
            quantity: i.quantity,
          }))
        })),
        clientMutationId: crypto.randomUUID(),
      };
      
      const res = await apiClient.post("/orders/checkout", payload);
      toast.success("Order placed successfully!");
      clear();
      router.push("/pharmacy/orders");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (lines.length === 0) {
    return (
      <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
        <PageHeader title="Shopping Cart" description="Review your selected products." />
        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-border py-16 text-center">
          <ShoppingCart className="size-10 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground">Looks like you haven't added any products to your cart yet.</p>
          <Button asChild className="mt-2">
            <Link href="/pharmacy/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Shopping Cart"
        description="Review your selected products before checking out."
        actions={
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={clear}>
            Clear Cart
          </Button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {groups.map(([supplierId, items]) => {
            const supplierName = items[0].supplierName;
            const supplierTotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
            
            return (
              <Card key={supplierId}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-brand-600" />
                    <CardTitle className="text-base">Supplier: {supplierName}</CardTitle>
                  </div>
                  <span className="font-semibold text-brand-700">${supplierTotal.toFixed(2)}</span>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.productName}</h4>
                        <div className="text-sm text-muted-foreground mt-1 flex gap-3">
                          <span>${item.unitPrice.toFixed(2)}/unit</span>
                          <span>MOQ: {item.moq}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="size-7"
                            onClick={() => setQuantity(item.productId, item.supplierId, item.quantity - 1)}
                            disabled={item.quantity <= item.moq}
                          >
                            -
                          </Button>
                          <Input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setQuantity(item.productId, item.supplierId, parseInt(e.target.value) || item.moq)}
                            className="h-7 w-16 text-center px-1"
                            min={item.moq}
                            max={item.maxStock}
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="size-7"
                            onClick={() => setQuantity(item.productId, item.supplierId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                          >
                            +
                          </Button>
                        </div>
                        
                        <div className="w-20 text-right font-medium">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLine(item.productId, item.supplierId)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({lines.length} items)</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated by supplier</span>
              </div>
              <div className="border-t border-border pt-4 flex justify-between font-bold">
                <span>Estimated Total</span>
                <span className="text-lg text-brand-700">${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCheckout} 
                disabled={isCheckingOut || lines.length === 0}
              >
                {isCheckingOut ? "Processing..." : (
                  <>
                    Proceed to Checkout <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
