"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { pharmacyNav } from "@/lib/nav-config";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePosSales } from "@/features/pos/hooks/use-pos";
import type { PosSale } from "@/features/pos/api/pos.types";

export default function PosHistoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  
  const { data: sales, isLoading } = usePosSales();

  const filteredSales = sales?.filter((s: PosSale) =>
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <DashboardShell sections={pharmacyNav} roleLabel="Pharmacy" userName="Pharmacy">
      <PageHeader
        title="POS Sales History"
        description="View past transactions, receipts, and process returns."
      />

      <Card className="mt-6">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipt ID or customer…"
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[12.5px] text-muted-foreground">{filteredSales.length} sales</p>
        </div>
        <Table className="border-0">
          <THead>
            <TR>
              <TH>Receipt ID</TH>
              <TH>Date & Time</TH>
              <TH>Customer</TH>
              <TH>Total</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  <TD colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TD>
                </TR>
              ))}

            {!isLoading && filteredSales.length === 0 && (
              <TR>
                <TD colSpan={6} className="py-10 text-center text-muted-foreground">
                  <ReceiptText className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  No sales found.
                </TD>
              </TR>
            )}

            {!isLoading &&
              filteredSales.map((s: PosSale) => (
                <TR 
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/pharmacy/pos/history/${s.id}`)}
                >
                  <TD className="font-medium text-[13px]">{s.id.slice(0, 13).toUpperCase()}</TD>
                  <TD className="text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString("en-US", { 
                      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </TD>
                  <TD className="text-muted-foreground">{s.customerName || "Walk-in"}</TD>
                  <TD className="font-semibold">${Number(s.totalAmount).toFixed(2)}</TD>
                  <TD>
                    <Badge 
                      variant={s.status === 'COMPLETED' ? 'success' : s.status === 'CANCELLED' ? 'danger' : 'warning'} 
                      dot
                    >
                      {s.status}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/pharmacy/pos/history/${s.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </Card>
    </DashboardShell>
  );
}
