"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

export default function PharmacyNotificationsPage() {
  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Sara Ahmad">
      <PageHeader title="Notifications" description="Order, inventory, and exchange updates for your pharmacy." />
      <NotificationCenter />
    </DashboardShell>
  );
}
