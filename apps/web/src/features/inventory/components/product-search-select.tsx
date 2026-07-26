import { useState, useEffect } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";

interface CatalogProduct {
  id: string;
  tradeNameAr: string;
  tradeNameEn: string;
  barcode?: string | null;
}

interface CatalogProductsResponse {
  data: CatalogProduct[];
}

interface ProductSearchSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProductSearchSelect({ value, onChange, placeholder = "Search master catalog..." }: ProductSearchSelectProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return { data: [] };
      return apiRequest<CatalogProductsResponse>({
        method: "GET",
        url: "/products",
        params: { search: debouncedSearch, limit: 10 },
      });
    },
    enabled: true,
  });

  const products = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? (data as unknown as CatalogProduct[])
      : [];
  const selectedProduct = products.find((product) => product.id === value) || (value ? { id: value, tradeNameEn: 'Selected Product', tradeNameAr: '' } : null);

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={placeholder}
          className="pl-9"
          placeholder={placeholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {selectedProduct && !search ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {selectedProduct.tradeNameEn || selectedProduct.tradeNameAr}
        </div>
      ) : null}
      {search ? (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-1 shadow-sm">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Searching...</p>
          ) : products.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No product found.</p>
          ) : (
            products.map((product) => (
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                key={product.id}
                type="button"
                onClick={() => {
                  onChange(product.id);
                  setSearch("");
                }}
              >
                <Check className={value === product.id ? "size-4 opacity-100" : "size-4 opacity-0"} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{product.tradeNameEn || product.tradeNameAr}</span>
                  {product.barcode ? (
                    <span className="text-xs text-muted-foreground">{product.barcode}</span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
