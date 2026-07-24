"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { useAuditLogs } from "@/features/admin/hooks/use-admin";
import { Badge } from "@/components/ui/badge";

export default function AdminAuditLogsPage() {
  const { data, isLoading } = useAuditLogs({ limit: 50 });
  const logs = data?.data || [];

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Admin">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of system activities, access, and modifications."
      />

      <div className="mt-6">
        <Card className="overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Date & Time</TH>
                  <TH>User</TH>
                  <TH>Action</TH>
                  <TH>Resource</TH>
                  <TH>Details</TH>
                </TR>
              </THead>
              <TBody>
                {isLoading ? (
                  <TR>
                    <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading audit logs...
                    </TD>
                  </TR>
                ) : logs?.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found.
                    </TD>
                  </TR>
                ) : (
                  logs?.map((log) => (
                    <TR key={log.id}>
                      <TD className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TD>
                      <TD>
                        <div className="font-medium text-sm">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                        </div>
                        <div className="text-xs text-muted-foreground">{log.user?.email}</div>
                      </TD>
                      <TD>
                        <Badge variant="neutral" className="capitalize text-xs">
                          {log.action.toLowerCase()}
                        </Badge>
                      </TD>
                      <TD className="text-sm text-muted-foreground capitalize">
                        {log.entityType.toLowerCase()}
                      </TD>
                      <TD className="text-sm">
                        {log.reason ? (
                          <div className="max-w-[200px] truncate text-muted-foreground" title={log.reason}>
                            {log.reason}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
