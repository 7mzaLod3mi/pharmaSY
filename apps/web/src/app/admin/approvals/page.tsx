"use client";

import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileCheck, X, ShieldCheck } from "lucide-react";
import {
  useAdminApprovals,
  useApproveOrganization,
  useRejectOrganization,
} from "@/features/admin-approvals/hooks/use-admin-approvals";

export default function AdminApprovalsPage() {
  const { data: approvals, isLoading } = useAdminApprovals();
  const approve = useApproveOrganization();
  const reject = useRejectOrganization();

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Layla Haddad">
      <PageHeader
        title="Approvals"
        description="Review and verify new organizations before they go live."
      />

      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}

        {!isLoading && approvals?.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border py-16 text-center">
            <ShieldCheck className="size-6 text-muted-foreground/60" />
            <p className="text-[13.5px] text-muted-foreground">No pending approvals — you&apos;re all caught up.</p>
          </div>
        )}

        {!isLoading &&
          approvals?.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-brand-50 text-brand-600">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-semibold">{a.name}</h3>
                      <Badge variant="brand" className="capitalize">{a.type}</Badge>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {a.contactEmail} · Submitted{" "}
                      {new Date(a.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.documents.map((d) => (
                        <span
                          key={d}
                          className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 py-1 text-[12px] text-muted-foreground"
                        >
                          <FileCheck className="size-3.5" /> {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      reject.mutate({ id: a.id });
                      toast.success(`${a.name} rejected`);
                    }}
                  >
                    <X className="size-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      approve.mutate(a.id);
                      toast.success(`${a.name} approved`);
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardShell>
  );
}
