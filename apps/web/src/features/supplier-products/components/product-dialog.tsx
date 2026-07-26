"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpsertSupplierProduct } from "../hooks/use-supplier-products";
import type { SupplierProduct } from "../api/supplier-products.types";
import { ProductSearchSelect } from "@/features/inventory/components/product-search-select";
import { normalizeApiError } from "@/lib/http-client";

interface ProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SupplierProduct | null;
}

export function ProductDialog({ isOpen, onOpenChange, product }: ProductDialogProps) {
  const upsertProduct = useUpsertSupplierProduct();
  
  const [formData, setFormData] = useState({
    productId: product?.productId || "",
    price: product?.price?.toString() || "",
    stock: product?.stock?.toString() || "",
    minOrder: product?.moq?.toString() || "1",
    expiryDate: product?.expiryDate?.slice(0, 10) || "",
    batchNumber: product?.batchNumber || "",
    notes: product?.notes || "",
    isAvailable: product?.isAvailable ?? true,
    discountTiers:
      product?.quantityDiscounts
        .map((tier) => `${tier.minQuantity}:${tier.unitPrice}`)
        .join(", ") || "",
  });

  useEffect(() => {
    setFormData({
      productId: product?.productId || "",
      price: product?.price?.toString() || "",
      stock: product?.stock?.toString() || "",
      minOrder: product?.moq?.toString() || "1",
      expiryDate: product?.expiryDate?.slice(0, 10) || "",
      batchNumber: product?.batchNumber || "",
      notes: product?.notes || "",
      isAvailable: product?.isAvailable ?? true,
      discountTiers:
        product?.quantityDiscounts
          .map((tier) => `${tier.minQuantity}:${tier.unitPrice}`)
          .join(", ") || "",
    });
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.productId ||
      !formData.price ||
      !formData.stock ||
      !formData.batchNumber.trim() ||
      !formData.expiryDate
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    
    const quantityDiscounts = formData.discountTiers
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [minimum, price] = entry.split(":").map(Number);
        return { minQuantity: minimum, unitPrice: price };
      });
    if (
      quantityDiscounts.some(
        (tier) =>
          !Number.isInteger(tier.minQuantity) ||
          tier.minQuantity < 1 ||
          !Number.isFinite(tier.unitPrice) ||
          tier.unitPrice < 0
      )
    ) {
      toast.error("Discount tiers must use the format quantity:price.");
      return;
    }

    upsertProduct.mutate(
      {
        productId: formData.productId,
        price: Number(formData.price),
        stock: Number(formData.stock),
        minOrder: Number(formData.minOrder),
        expiryDate: formData.expiryDate,
        batchNumber: formData.batchNumber.trim(),
        notes: formData.notes.trim() || undefined,
        isAvailable: formData.isAvailable,
        quantityDiscounts,
      },
      {
        onSuccess: () => {
          toast.success(product ? "Product updated successfully" : "Product added successfully");
          onOpenChange(false);
        },
        onError: (error) => toast.error(normalizeApiError(error).message),
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {product 
              ? "Update pricing and stock for your marketplace listing." 
              : "Add a new product from the master catalog to your listings."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Master catalog product</label>
              {product ? (
                <Input value={product.name} disabled />
              ) : (
                <ProductSearchSelect
                  value={formData.productId}
                  onChange={(productId) =>
                    setFormData((current) => ({ ...current, productId }))
                  }
                  placeholder="Search the master catalog..."
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="price">Price ($)</label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="stock">Initial Stock</label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="minOrder">Minimum Order Quantity (MOQ)</label>
              <Input
                id="minOrder"
                type="number"
                min="1"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                placeholder="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="batchNumber">
                  Batch number
                </label>
                <Input
                  id="batchNumber"
                  required
                  value={formData.batchNumber}
                  onChange={(event) =>
                    setFormData({ ...formData, batchNumber: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="expiryDate">
                  Expiry date
                </label>
                <Input
                  id="expiryDate"
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(event) =>
                    setFormData({ ...formData, expiryDate: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="discountTiers">
                Quantity discounts
              </label>
              <Input
                id="discountTiers"
                placeholder="10:9.50, 50:8.75"
                value={formData.discountTiers}
                onChange={(event) =>
                  setFormData({ ...formData, discountTiers: event.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter each minimum quantity and unit price separated by a colon.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="notes">Notes</label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(event) =>
                  setFormData({ ...formData, notes: event.target.value })
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                checked={formData.isAvailable}
                type="checkbox"
                onChange={(event) =>
                  setFormData({ ...formData, isAvailable: event.target.checked })
                }
              />
              Available in marketplace
            </label>
          </DialogBody>
          
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={upsertProduct.isPending}>
              {upsertProduct.isPending ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
