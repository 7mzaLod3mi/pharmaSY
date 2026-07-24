"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, ShieldCheck, TrendingUp, ArrowUpRight } from "lucide-react";

const pendingApprovals = [
  { name: "MediPlus Pharmacy", type: "Pharmacy", submitted: "Jul 19, 2026" },
  { name: "Green Valley Distribution", type: "Supplier", submitted: "Jul 18, 2026" },
  { name: "Care Point Branch 2", type: "Pharmacy", submitted: "Jul 17, 2026" },
];

export default function AdminDashboardPage() {
  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Layla Haddad">
      <PageHeader
        title="Dashboard"
        description="Platform-wide overview across organizations and activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value="286" animatedValue={286} delta={{ value: "+12", direction: "up" }} icon={Building2} />
        <StatCard label="Active users" value="4,120" animatedValue={4120} delta={{ value: "+3.2%", direction: "up" }} icon={Users} />
        <StatCard label="Pending approvals" value="8" animatedValue={8} icon={ShieldCheck} />
        <StatCard label="GMV this month" value="$1.24M" animatedValue={1.24} format="currency" suffix="M" delta={{ value: "+11%", direction: "up" }} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>New organizations waiting for verification</CardDescription>
          </div>
          <Button variant="secondary" size="sm">
            View all <ArrowUpRight className="size-3.5" />
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
            {pendingApprovals.map((a) => (
              <TR key={a.name}>
                <TD className="font-medium">{a.name}</TD>
                <TD>
                  <Badge variant="brand">{a.type}</Badge>
                </TD>
                <TD className="text-muted-foreground">{a.submitted}</TD>
                <TD className="space-x-2">
                  <Button size="sm">Approve</Button>
                  <Button size="sm" variant="secondary">Review</Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
