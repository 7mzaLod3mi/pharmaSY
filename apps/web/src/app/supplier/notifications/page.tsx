"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { supplierNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";

export default function SupplierNotificationsPage() {
  return (
    <DashboardShell sections={supplierNav} roleLabel="Supplier" userName="Omar Nasser">
      <PageHeader title="Notifications" description="Order and import updates for your supplier account." />
      <NotificationCenter />
    </DashboardShell>
  );
}
