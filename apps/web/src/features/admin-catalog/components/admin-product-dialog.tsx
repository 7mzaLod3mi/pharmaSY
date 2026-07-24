"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Product, ProductStatus } from "@pharmasyn/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { normalizeApiError } from "@/lib/http-client";
import {
  type CreateProductDto,
  useAdminCategories,
  useAdminManufacturers,
  useCreateProduct,
  useUpdateProduct,
} from "../hooks/use-admin-catalog";

interface AdminProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

const emptyForm: CreateProductDto = {
  tradeNameAr: "",
  tradeNameEn: "",
  categoryId: "",
  unit: "piece",
};

export function AdminProductDialog({
  open,
  onOpenChange,
  product,
}: AdminProductDialogProps) {
  const categories = useAdminCategories();
  const manufacturers = useAdminManufacturers();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [form, setForm] = useState<CreateProductDto>(emptyForm);
  const [status, setStatus] = useState<ProductStatus | undefined>();

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            tradeNameAr: product.tradeNameAr,
            tradeNameEn: product.tradeNameEn,
            scientificName: product.scientificName,
            dosageForm: product.dosageForm,
            strength: product.strength,
            packageSize: product.packageSize,
            barcode: product.barcode,
            categoryId: product.categoryId,
            manufacturerId: product.manufacturerId,
            imageUrl: product.imageUrl,
            unit: product.unit,
            description: product.description,
          }
        : emptyForm
    );
    setStatus(product?.status);
  }, [open, product]);

  const setField = <K extends keyof CreateProductDto>(
    key: K,
    value: CreateProductDto[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (product) {
        await update.mutateAsync({
          id: product.id,
          data: { ...form, status },
        });
      } else {
        await create.mutateAsync(form);
      }
      toast.success(product ? "Product updated." : "Product created.");
      onOpenChange(false);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{product ? "Edit product" : "Add master product"}</DialogTitle>
            <DialogDescription>
              Products in this catalog are the verified source of truth for pharmacies and suppliers.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              English trade name
              <Input
                minLength={2}
                required
                value={form.tradeNameEn}
                onChange={(event) => setField("tradeNameEn", event.target.value)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Arabic trade name
              <Input
                dir="rtl"
                minLength={2}
                required
                value={form.tradeNameAr}
                onChange={(event) => setField("tradeNameAr", event.target.value)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Scientific name
              <Input
                value={form.scientificName ?? ""}
                onChange={(event) => setField("scientificName", event.target.value || undefined)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Barcode
              <Input
                value={form.barcode ?? ""}
                onChange={(event) => setField("barcode", event.target.value || undefined)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Category
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                required
                value={form.categoryId}
                onChange={(event) => setField("categoryId", event.target.value)}
              >
                <option value="">Select category</option>
                {categories.data
                  ?.filter((category) => category.isActive)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nameEn} / {category.nameAr}
                    </option>
                  ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Manufacturer
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={form.manufacturerId ?? ""}
                onChange={(event) =>
                  setField("manufacturerId", event.target.value || undefined)
                }
              >
                <option value="">No manufacturer</option>
                {manufacturers.data
                  ?.filter((manufacturer) => manufacturer.isActive)
                  .map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Dosage form
              <Input
                value={form.dosageForm ?? ""}
                onChange={(event) => setField("dosageForm", event.target.value || undefined)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Strength
              <Input
                value={form.strength ?? ""}
                onChange={(event) => setField("strength", event.target.value || undefined)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Package size
              <Input
                value={form.packageSize ?? ""}
                onChange={(event) => setField("packageSize", event.target.value || undefined)}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Unit
              <Input
                minLength={1}
                required
                value={form.unit}
                onChange={(event) => setField("unit", event.target.value)}
              />
            </label>
            {product ? (
              <label className="space-y-1.5 text-sm font-medium">
                Status
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProductStatus)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
