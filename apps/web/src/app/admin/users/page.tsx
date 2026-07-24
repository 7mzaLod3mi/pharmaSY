"use client";

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
import { Ban, CheckCircle } from "lucide-react";
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
} from "@/features/admin/hooks/use-admin";
import { normalizeApiError } from "@/lib/http-client";

export default function AdminUsersPage() {
  const { data, isLoading } = useAdminUsers({ limit: 50 });
  const suspendUser = useSuspendUser();
  const activateUser = useActivateUser();

  const users = data?.data || [];

  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Admin">
      <PageHeader
        title="Users"
        description="Manage platform users, including organization owners."
      />

      <div className="mt-6">
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Contact</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </TD>
                </TR>
              ) : users?.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TD>
                </TR>
              ) : (
                users?.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <div className="font-medium text-sm">{u.firstName} {u.lastName}</div>
                    </TD>
                    <TD className="text-sm text-muted-foreground">
                      <div>{u.email}</div>
                    </TD>
                    <TD>
                      <Badge variant="neutral" className="capitalize">{u.role.toLowerCase()}</Badge>
                    </TD>
                    <TD>
                      <Badge variant={u.status === "ACTIVE" ? "success" : u.status === "PENDING" ? "warning" : "neutral"} dot>
                        {u.status}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === "ACTIVE" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-destructive hover:text-destructive/80"
                            title="Suspend user"
                            onClick={() => {
                              if (window.confirm("Suspend this user? They will lose access to the platform.")) {
                                suspendUser.mutate(u.id, {
                                  onSuccess: () => toast.success("User suspended"),
                                  onError: (error) => toast.error(normalizeApiError(error).message),
                                });
                              }
                            }}
                          >
                            <Ban className="size-4" />
                          </Button>
                        )}
                        {u.status === "SUSPENDED" && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-brand-600 hover:text-brand-700"
                            title="Activate user"
                            onClick={() => {
                              activateUser.mutate(u.id, {
                                onSuccess: () => toast.success("User activated"),
                                onError: (error) => toast.error(normalizeApiError(error).message),
                              });
                            }}
                          >
                            <CheckCircle className="size-4" />
                          </Button>
                        )}
                      </div>
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
