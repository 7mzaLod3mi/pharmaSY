"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Ban, RotateCcw, PackageX } from "lucide-react";
import {
  useAdminOrganizations,
  useReactivateOrganization,
  useSuspendOrganization,
} from "@/features/admin-organizations/hooks/use-admin-organizations";

const statusMap = {
  verified: { label: "Verified", variant: "success" as const },
  pending: { label: "Pending", variant: "warning" as const },
  suspended: { label: "Suspended", variant: "danger" as const },
};

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState("");
  const { data: orgs, isLoading } = useAdminOrganizations({ search });
  const suspend = useSuspendOrganization();
  const reactivate = useReactivateOrganization();

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Layla Haddad">
      <PageHeader
        title="Organizations"
        description="Every pharmacy and supplier organization on the platform."
        actions={
          <Button>
            <Plus className="size-4" /> Invite organization
          </Button>
        }
      />

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search organizations…"
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground">{orgs?.length ?? 0} organizations</p>
        </div>
        <Table className="border-0">
          <THead>
            <TR>
              <TH>Organization</TH>
              <TH>Type</TH>
              <TH>Users</TH>
              <TH>Member since</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TD>
                </TR>
              ))}

            {!isLoading && orgs?.length === 0 && (
              <TR>
                <TD colSpan={6} className="py-10 text-center text-muted-foreground">
                  <PackageX className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  No organizations match your search.
                </TD>
              </TR>
            )}

            {!isLoading &&
              orgs?.map((o) => (
                <TR key={o.id}>
                  <TD className="font-medium">{o.name}</TD>
                  <TD className="text-muted-foreground capitalize">{o.type}</TD>
                  <TD className="text-muted-foreground">{o.users}</TD>
                  <TD className="text-muted-foreground">
                    {new Date(o.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </TD>
                  <TD>
                    <Badge variant={statusMap[o.status].variant} dot>
                      {statusMap[o.status].label}
                    </Badge>
                  </TD>
                  <TD>
                    {o.status === "suspended" ? (
                      <button
                        onClick={() => {
                          reactivate.mutate(o.id);
                          toast.success(`${o.name} reactivated`);
                        }}
                        title="Reactivate"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-success-600 transition-colors duration-200 hover:bg-black/[0.04]"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          suspend.mutate(o.id);
                          toast.success(`${o.name} suspended`);
                        }}
                        title="Suspend"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors duration-200 hover:bg-black/[0.04] hover:text-danger-600"
                      >
                        <Ban className="size-3.5" />
                      </button>
                    )}
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
