"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

export default function AdminNotificationsPage() {
  return (
    <DashboardShell sections={adminNav} roleLabel="Administrator" userName="Layla Haddad">
      <PageHeader title="Notifications" description="Platform-wide administrative and system notifications." />
      <NotificationCenter />
    </DashboardShell>
  );
}
