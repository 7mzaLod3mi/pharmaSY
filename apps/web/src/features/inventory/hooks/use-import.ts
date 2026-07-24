import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ImportRow {
  rowId: string;
  productId: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  purchaseCost: number;
  sellingPrice?: number;
  minStock?: number;
  location?: string;
}

interface CommitImportPayload {
  clientMutationId: string;
  importId?: string;
  conflictStrategy: 'SKIP' | 'UPDATE';
  rows: ImportRow[];
}

export function useCommitInventoryImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommitImportPayload) => {
      const response = await apiClient.post('/inventory/import/commit', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
