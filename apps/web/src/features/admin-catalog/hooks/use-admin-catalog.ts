"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/http-client";
import type { ApiResponse, PaginationQuery, Product, ProductStatus } from "@pharmasyn/types";

interface CreateProductDto {
  tradeNameAr: string;
  tradeNameEn: string;
  scientificName?: string;
  dosageForm?: string;
  strength?: string;
  packageSize?: string;
  barcode?: string;
  categoryId: string;
  manufacturerId?: string;
  imageUrl?: string;
  unit: string;
  description?: string;
}

interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: ProductStatus;
}

export function useAdminProducts(query?: PaginationQuery) {
  return useQuery({
    queryKey: ["admin", "products", query],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query?.page) searchParams.set("page", query.page.toString());
      if (query?.limit) searchParams.set("limit", query.limit.toString());
      if (query?.search) searchParams.set("search", query.search);


      const res = await apiClient.get<ApiResponse<Product[]>>(`/products?${searchParams.toString()}`);
      return res.data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const res = await apiClient.post<ApiResponse<Product>>("/products", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }) => {
      const res = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

// -- Product Requests

export function useAdminProductRequests() {
  return useQuery({
    queryKey: ["admin", "product-requests"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>("/product-requests");
      return res.data;
    },
  });
}

export function useApproveProductRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: string; categoryId: string }) => {
      await apiClient.patch(`/product-requests/${id}/approve`, { categoryId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product-requests"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useRejectProductRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.patch(`/product-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product-requests"] });
    },
  });
}

export function useMergeProductRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      await apiClient.patch(`/product-requests/${id}/merge`, { productId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product-requests"] });
    },
  });
}
