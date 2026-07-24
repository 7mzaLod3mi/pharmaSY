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
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { Inbox, Check, X, Combine } from "lucide-react";
import {
  useAdminProductRequests,
  useApproveProductRequest,
  useRejectProductRequest,
} from "@/features/admin-catalog/hooks/use-admin-catalog";

export default function AdminProductRequestsPage() {
  const { data, isLoading } = useAdminProductRequests();
  const approve = useApproveProductRequest();
  const reject = useRejectProductRequest();

  const requests = data?.data || [];

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
                  requests.map((r: any) => (
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
                          >
                            <Combine className="size-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-destructive hover:text-destructive/80"
                            onClick={() => {
                              const reason = window.prompt("Rejection reason:");
                              if (reason) {
                                reject.mutate({ id: r.id, reason }, {
                                  onSuccess: () => toast.success("Request rejected")
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
                            onClick={() => {
                              // Simplified for now, usually would open a dialog to assign category
                              const categoryId = window.prompt("Enter Category ID (UUID) to approve:");
                              if (categoryId) {
                                approve.mutate({ id: r.id, categoryId }, {
                                  onSuccess: () => toast.success("Request approved and created as master product")
                                });
                              }
                            }}
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
    </DashboardShell>
  );
}
