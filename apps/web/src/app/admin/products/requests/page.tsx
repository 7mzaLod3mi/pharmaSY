"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { Check, X, Combine } from "lucide-react";
import {
  useAdminProductRequests,
  useAdminCategories,
  useAdminManufacturers,
  useAdminProducts,
  useApproveProductRequest,
  useMergeProductRequest,
  useRejectProductRequest,
  type AdminProductRequest,
} from "@/features/admin-catalog/hooks/use-admin-catalog";
import { normalizeApiError } from "@/lib/http-client";

export default function AdminProductRequestsPage() {
  const { data, isLoading } = useAdminProductRequests();
  const approve = useApproveProductRequest();
  const reject = useRejectProductRequest();
  const merge = useMergeProductRequest();
  const categories = useAdminCategories();
  const manufacturers = useAdminManufacturers();
  const products = useAdminProducts({ limit: 100 });
  const [resolution, setResolution] = useState<{
    request: AdminProductRequest;
    mode: "approve" | "merge";
  }>();
  const [categoryId, setCategoryId] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [tradeNameAr, setTradeNameAr] = useState("");
  const [tradeNameEn, setTradeNameEn] = useState("");
  const [unit, setUnit] = useState("box");
  const [productId, setProductId] = useState("");

  const requests = data || [];

  const openResolution = (
    request: AdminProductRequest,
    mode: "approve" | "merge"
  ) => {
    setResolution({ request, mode });
    setTradeNameAr(request.brandName);
    setTradeNameEn(request.brandName);
    setCategoryId("");
    setManufacturerId("");
    setUnit("box");
    setProductId("");
  };

  const submitResolution = async () => {
    if (!resolution) return;
    try {
      if (resolution.mode === "approve") {
        await approve.mutateAsync({
          id: resolution.request.id,
          categoryId,
          tradeNameAr,
          tradeNameEn,
          unit,
          manufacturerId: manufacturerId || undefined,
        });
        toast.success("Request approved and added to the master catalog.");
      } else {
        await merge.mutateAsync({ id: resolution.request.id, productId });
        toast.success("Request merged with the selected master product.");
      }
      setResolution(undefined);
    } catch (error) {
      toast.error(normalizeApiError(error).message);
    }
  };

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Admin">
      <PageHeader
        title="Product Requests"
        description="Review new product requests submitted by suppliers and pharmacies."
      />

      <div className="mt-6">
        <Card className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Product Name</TH>
                  <TH>Requested By</TH>
                  <TH>Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {isLoading ? (
                  <TR>
                    <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading requests...
                    </TD>
                  </TR>
                ) : requests.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                      No pending requests found.
                    </TD>
                  </TR>
                ) : (
                  requests.map((r) => (
                    <TR key={r.id}>
                      <TD>
                        <div className="font-medium text-sm">{r.brandName}</div>
                        <div className="text-xs text-muted-foreground">{r.genericName}</div>
                      </TD>
                      <TD className="text-sm text-muted-foreground">
                        {r.requester?.firstName} {r.requester?.lastName}
                      </TD>
                      <TD className="text-sm text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TD>
                      <TD>
                        <Badge variant={r.status === "PENDING" ? "warning" : "neutral"}>
                          {r.status}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        {r.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-muted-foreground hover:text-foreground"
                            title="Merge with existing"
                            onClick={() => openResolution(r, "merge")}
                          >
                            <Combine className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-destructive hover:text-destructive/80"
                            onClick={() => {
                              const reason = window.prompt("Rejection reason (required):")?.trim();
                              if (reason && reason.length >= 3) {
                                reject.mutate({ id: r.id, reason }, {
                                  onSuccess: () => toast.success("Request rejected"),
                                  onError: (error) =>
                                    toast.error(normalizeApiError(error).message),
                                });
                              }
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-brand-600 hover:text-brand-700"
                            onClick={() => openResolution(r, "approve")}
                          >
                            <Check className="size-4" />
                          </Button>
                        </div>
                      )}
                    </TD>
                  </TR>
                ))
              )}
              </TBody>
            </Table>
        </Card>
      </div>
      <Dialog
        open={Boolean(resolution)}
        onOpenChange={(open) => {
          if (!open) setResolution(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolution?.mode === "approve"
                ? "Approve master product"
                : "Merge duplicate request"}
            </DialogTitle>
            <DialogDescription>
              {resolution?.mode === "approve"
                ? "Confirm the bilingual source-of-truth data before creating the product."
                : "Select the existing verified product that this request represents."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {resolution?.mode === "approve" ? (
              <>
                <label className="block space-y-1.5 text-sm font-medium">
                  English trade name
                  <Input
                    minLength={2}
                    value={tradeNameEn}
                    onChange={(event) => setTradeNameEn(event.target.value)}
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  Arabic trade name
                  <Input
                    dir="rtl"
                    minLength={2}
                    value={tradeNameAr}
                    onChange={(event) => setTradeNameAr(event.target.value)}
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  Category
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
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
                <label className="block space-y-1.5 text-sm font-medium">
                  Manufacturer
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={manufacturerId}
                    onChange={(event) => setManufacturerId(event.target.value)}
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
                <label className="block space-y-1.5 text-sm font-medium">
                  Unit
                  <Input
                    minLength={1}
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="block space-y-1.5 text-sm font-medium">
                Existing master product
                <select
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                >
                  <option value="">Select product</option>
                  {products.data?.data.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.tradeNameEn} / {product.tradeNameAr}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolution(undefined)}>
              Cancel
            </Button>
            <Button
              disabled={
                approve.isPending ||
                merge.isPending ||
                (resolution?.mode === "approve"
                  ? !categoryId ||
                    tradeNameAr.trim().length < 2 ||
                    tradeNameEn.trim().length < 2 ||
                    !unit.trim()
                  : !productId)
              }
              onClick={submitResolution}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
