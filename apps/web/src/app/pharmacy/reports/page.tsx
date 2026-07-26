"use client";

import { ReportCenter } from "@/features/reports/components/report-center";
import { pharmacyNav } from "@/lib/nav-config";

export default function PharmacyReportsPage() {
  return <ReportCenter sections={pharmacyNav} roleLabel="Pharmacy" />;
}
