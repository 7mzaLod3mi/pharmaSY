"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ShieldCheck, ClipboardList, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useAdminStats } from "@/features/admin/hooks/use-admin";
import { useAdminApprovals } from "@/features/admin-approvals/hooks/use-admin-approvals";

export default function AdminDashboardPage() {
  const stats = useAdminStats();
  const approvals = useAdminApprovals();
  const pendingApprovals = approvals.data?.slice(0, 5) ?? [];

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Admin">
      <PageHeader
        title="Dashboard"
        description="Platform-wide overview across organizations and activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Approved organizations" value={String((stats.data?.totalPharmacies ?? 0) + (stats.data?.totalSuppliers ?? 0))} animatedValue={(stats.data?.totalPharmacies ?? 0) + (stats.data?.totalSuppliers ?? 0)} icon={Building2} />
        <StatCard label="Users" value={String(stats.data?.totalUsers ?? 0)} animatedValue={stats.data?.totalUsers ?? 0} icon={Users} />
        <StatCard label="Pending approvals" value={String(stats.data?.pendingApprovals ?? 0)} animatedValue={stats.data?.pendingApprovals ?? 0} icon={ShieldCheck} />
        <StatCard label="Orders" value={String(stats.data?.totalOrders ?? 0)} animatedValue={stats.data?.totalOrders ?? 0} icon={ClipboardList} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>New organizations waiting for verification</CardDescription>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/approvals">
            View all <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Organization</TH>
              <TH>Type</TH>
              <TH>Submitted</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {approvals.isLoading ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-muted-foreground">
                  Loading approvals...
                </TD>
              </TR>
            ) : pendingApprovals.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-muted-foreground">
                  No organizations are awaiting approval.
                </TD>
              </TR>
            ) : pendingApprovals.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">{a.name}</TD>
                <TD>
                  <Badge variant="brand">{a.type}</Badge>
                </TD>
                <TD className="text-muted-foreground">
                  {new Date(a.submittedAt).toLocaleDateString()}
                </TD>
                <TD>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href="/admin/approvals">Review</Link>
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
