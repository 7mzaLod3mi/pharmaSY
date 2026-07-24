"use client";

import { useState } from "react";
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

interface ProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SupplierProduct | null;
}

export function ProductDialog({ isOpen, onOpenChange, product }: ProductDialogProps) {
  const upsertProduct = useUpsertSupplierProduct();
  
  const [formData, setFormData] = useState({
    productId: product?.id || "",
    price: product?.price?.toString() || "",
    stock: product?.id ? "100" : "", // Mock for now, stock isn't in SupplierProduct type directly but moq is
    minOrder: product?.moq?.toString() || "1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.price || !formData.stock) {
      toast.error("Please fill all required fields");
      return;
    }
    
    upsertProduct.mutate(
      {
        productId: formData.productId,
        price: Number(formData.price),
        stock: Number(formData.stock),
        minOrder: Number(formData.minOrder),
      },
      {
        onSuccess: () => {
          toast.success(product ? "Product updated successfully" : "Product added successfully");
          onOpenChange(false);
        },
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
              <label className="text-sm font-medium" htmlFor="productId">Master Product ID (UUID)</label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                placeholder="Enter master product ID"
                disabled={!!product}
              />
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
