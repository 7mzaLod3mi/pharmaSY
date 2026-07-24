"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettings } from "@/features/settings/components/profile-settings";
import { NotificationSettings } from "@/features/settings/components/notification-settings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Plus, Settings2, Users } from "lucide-react";

export default function PharmacySettingsPage() {
  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="Settings"
        description="Manage your pharmacy profile, notifications, and team access."
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <ProfileSettings />
          <NotificationSettings />
        </div>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5" /> Team Members
                  </CardTitle>
                  <CardDescription>Manage staff accounts and POS access.</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 size-4" /> Add Staff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Name</TH>
                    <TH>Role</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  <TR>
                    <TD>
                      <div className="font-medium">Sara Ahmad</div>
                      <div className="text-xs text-muted-foreground">sara@pharmasy.com</div>
                    </TD>
                    <TD>Manager</TD>
                    <TD><Badge variant="success">Active</Badge></TD>
                  </TR>
                  <TR>
                    <TD>
                      <div className="font-medium">Ali Kamal</div>
                      <div className="text-xs text-muted-foreground">ali.k@pharmasy.com</div>
                    </TD>
                    <TD>Cashier</TD>
                    <TD><Badge variant="success">Active</Badge></TD>
                  </TR>
                </TBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="size-5" /> System Preferences
              </CardTitle>
              <CardDescription>Configure POS defaults and receipt printing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-print Receipts</div>
                  <div className="text-sm text-muted-foreground">Automatically trigger print dialog after POS sale</div>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Low Stock Alerts</div>
                  <div className="text-sm text-muted-foreground">Default minimum threshold for new products</div>
                </div>
                <select className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option>5 units</option>
                  <option>10 units</option>
                  <option>20 units</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
