"use client";

import { ReactNode, useEffect } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNav, pharmacyNav, supplierNav } from "@/lib/nav-config";
import { useAuth } from "@/features/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user, state } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (state === "anonymous") {
      router.replace("/login");
    }
  }, [router, state]);

  if (state === "loading" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {state === "loading" ? "Loading account…" : "Redirecting to login…"}
      </div>
    );
  }

  const sections = 
    user.role === "ADMIN" ? adminNav : 
    user.role === "SUPPLIER" ? supplierNav : 
    pharmacyNav;

  const roleLabel = 
    user.role === "ADMIN" ? "Administrator" : 
    user.role === "SUPPLIER" ? "Supplier" : 
    "Pharmacy";

  return (
    <DashboardShell sections={sections} roleLabel={roleLabel} userName={user.firstName}>
      <PageHeader
        title="Settings & Preferences"
        description="Manage your account profile and notification preferences."
      />
      
      <div className="mt-6">
        <Tabs 
          value={pathname.includes("/notifications") ? "notifications" : "profile"} 
          className="mb-8"
          onValueChange={(val) => router.push(`/${val}`)}
        >
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="max-w-3xl">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
