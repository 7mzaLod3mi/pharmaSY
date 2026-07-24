"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiRequest } from "@/lib/http-client";
import type { ApiResponse, PaginationQuery, Product, ProductStatus } from "@pharmasyn/types";

export interface CreateProductDto {
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

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: ProductStatus;
}

export interface AdminCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminManufacturer {
  id: string;
  name: string;
  country?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface CategoryInput {
  nameAr: string;
  nameEn: string;
  slug: string;
  parentId?: string;
  sortOrder?: number;
}

export interface ManufacturerInput {
  name: string;
  country?: string;
  logoUrl?: string;
}

export interface AdminProductRequest {
  id: string;
  brandName: string;
  genericName?: string | null;
  manufacturer?: string | null;
  category?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  packageSize?: string | null;
  barcode?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MERGED";
  rejectionReason?: string | null;
  createdAt: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
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
      return apiRequest<AdminProductRequest[]>({
        method: "GET",
        url: "/product-requests",
      });
    },
  });
}

export function useApproveProductRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      categoryId,
      tradeNameAr,
      tradeNameEn,
      unit,
      manufacturerId,
    }: {
      id: string;
      categoryId: string;
      tradeNameAr: string;
      tradeNameEn: string;
      unit: string;
      manufacturerId?: string;
    }) => {
      await apiClient.patch(`/product-requests/${id}/approve`, {
        categoryId,
        tradeNameAr,
        tradeNameEn,
        unit,
        manufacturerId,
      });
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

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () =>
      apiRequest<AdminCategory[]>({
        method: "GET",
        url: "/categories",
        params: { includeInactive: true },
      }),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryInput) =>
      apiRequest<AdminCategory>({ method: "POST", url: "/categories", data }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CategoryInput> & { isActive?: boolean };
    }) =>
      apiRequest<AdminCategory>({
        method: "PATCH",
        url: `/categories/${id}`,
        data,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>({ method: "DELETE", url: `/categories/${id}` }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useAdminManufacturers(search = "") {
  return useQuery({
    queryKey: ["admin", "manufacturers", search],
    queryFn: () =>
      apiRequest<AdminManufacturer[]>({
        method: "GET",
        url: "/manufacturers",
        params: { search: search || undefined, includeInactive: true },
      }),
  });
}

export function useCreateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ManufacturerInput) =>
      apiRequest<AdminManufacturer>({
        method: "POST",
        url: "/manufacturers",
        data,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "manufacturers"] }),
  });
}

export function useUpdateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ManufacturerInput> & { isActive?: boolean };
    }) =>
      apiRequest<AdminManufacturer>({
        method: "PATCH",
        url: `/manufacturers/${id}`,
        data,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "manufacturers"] }),
  });
}

export function useDeleteManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>({ method: "DELETE", url: `/manufacturers/${id}` }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "manufacturers"] }),
  });
}
