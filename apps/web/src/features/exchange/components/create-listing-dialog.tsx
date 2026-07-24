"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createExchangeListingSchema,
  type CreateExchangeListingFormValues,
} from "../schemas/create-listing.schema";
import { useCreateExchangeListing } from "../hooks/use-exchange";

const cities = ["Amman", "Irbid", "Zarqa", "Aqaba"];

export function CreateListingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateExchangeListingFormValues>({
    resolver: zodResolver(createExchangeListingSchema),
  });

  const createListing = useCreateExchangeListing();

  const onSubmit = async (values: CreateExchangeListingFormValues) => {
    try {
      await createListing.mutateAsync(values);
      toast.success("Listing submitted for review");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Couldn't create the listing. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create exchange listing</DialogTitle>
            <DialogDescription>
              List slow-moving or surplus stock for other pharmacies to purchase. Submitted listings are
              reviewed before going live.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="productName">Product</Label>
              <Input id="productName" placeholder="e.g. Vitamin D3 5000IU (60 units)" {...register("productName")} />
              {errors.productName && <p className="text-[12px] text-danger-600">{errors.productName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batchNumber">Batch number</Label>
                <Input id="batchNumber" placeholder="e.g. VD-2405" {...register("batchNumber")} />
                {errors.batchNumber && <p className="text-[12px] text-danger-600">{errors.batchNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">Expiry date</Label>
                <Input id="expiryDate" type="date" {...register("expiryDate")} />
                {errors.expiryDate && <p className="text-[12px] text-danger-600">{errors.expiryDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  {...register("city")}
                  defaultValue=""
                  className="flex h-10 w-full cursor-pointer rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-xs)] transition-[box-shadow,border-color] duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/15 focus-visible:border-brand-500"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.city && <p className="text-[12px] text-danger-600">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
                {errors.quantity && <p className="text-[12px] text-danger-600">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" min={0} step="0.01" {...register("price", { valueAsNumber: true })} />
                {errors.price && <p className="text-[12px] text-danger-600">{errors.price.message}</p>}
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={isSubmitting}>
              Submit for review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
