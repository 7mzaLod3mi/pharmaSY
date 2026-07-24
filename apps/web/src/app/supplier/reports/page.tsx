"use client";

import { supplierNav } from "@/lib/nav-config";
import { ReportCenter } from "@/features/reports/components/report-center";

export default function SupplierReportsPage() {
  return <ReportCenter sections={supplierNav} roleLabel="Supplier" />;
}
