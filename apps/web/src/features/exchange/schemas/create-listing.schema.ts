import { z } from "zod";

export const createExchangeListingSchema = z.object({
  productName: z.string().min(3, "Enter a product name"),
  batchNumber: z.string().min(1, "Batch number is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  city: z.string().min(1, "Select a city"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  price: z.number().positive("Price must be greater than 0"),
});

export type CreateExchangeListingFormValues = z.infer<typeof createExchangeListingSchema>;
