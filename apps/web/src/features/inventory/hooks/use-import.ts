import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';

export interface ImportRow {
  rowId: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseCost: number;
  sellingPrice?: number;
  minStock?: number;
  location?: string;
}

export interface CommitImportPayload {
  clientMutationId: string;
  importId?: string;
  conflictStrategy: 'SKIP' | 'UPDATE';
  rows: ImportRow[];
}

export interface ProductRequestInput {
  brandName: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  barcode?: string;
  notes?: string;
}

export function useCommitInventoryImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommitImportPayload) => {
      return apiRequest({
        method: "POST",
        url: "/inventory/import/commit",
        data: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateProductRequest() {
  return useMutation({
    mutationFn: (payload: ProductRequestInput) =>
      apiRequest({
        method: "POST",
        url: "/product-requests",
        data: payload,
      }),
  });
}
