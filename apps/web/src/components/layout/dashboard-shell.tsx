"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type NavSection } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileSidebarDrawer } from "./mobile-sidebar-drawer";
import { useAuth, getOnboardingRedirectPath } from "@/features/auth/auth-provider";
import { useLocale } from "@/lib/i18n";

export function DashboardShell({
  sections,
  roleLabel,
  userName,
  children,
}: {
  sections: NavSection[];
  roleLabel: string;
  userName: string;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const { state, user } = useAuth();
  const { t } = useLocale();
  const rolePrefix = sections[0]?.items[0]?.href.split("/")[1] ?? "";
  const notificationsHref = rolePrefix ? `/${rolePrefix}/notifications` : "/";
  const expectedRole =
    rolePrefix === "admin" ? "ADMIN" : rolePrefix === "supplier" ? "SUPPLIER" : "PHARMACY";

  useEffect(() => {
    if (state === "anonymous") {
      router.replace("/login");
      return;
    }
    if (state === "authenticated" && user) {
      if (
        user.status === "BANNED" ||
        user.accountState === "ACCOUNT_BANNED" ||
        user.status === "SUSPENDED" ||
        user.accountState === "ACCOUNT_SUSPENDED"
      ) {
        return;
      }
      if (user.role !== expectedRole && expectedRole) {
        return;
      }
      const targetPath = getOnboardingRedirectPath(user);
      if (!targetPath.startsWith(`/${rolePrefix}`)) {
        router.replace(targetPath);
      }
    }
  }, [router, state, user, rolePrefix, expectedRole]);

  if (state === "loading" || state === "anonymous") {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground animate-pulse">Loading workspace…</div>;
  }

  if (!user || user.role !== expectedRole) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-danger-500">You do not have permission to access this workspace.</div>;
  }

  if (user.status === "BANNED" || user.accountState === "ACCOUNT_BANNED") {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-danger-500">{t("auth.state.accountBanned")}</div>;
  }

  if (user.status === "SUSPENDED" || user.accountState === "ACCOUNT_SUSPENDED") {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-danger-500">{t("auth.state.accountSuspended")}</div>;
  }

  const targetPath = getOnboardingRedirectPath(user);
  if (!targetPath.startsWith(`/${rolePrefix}`)) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground animate-pulse">{t("auth.state.organizationPending")}...</div>;
  }


  const authenticatedName = `${user.firstName} ${user.lastName}`.trim() || userName;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar sections={sections} roleLabel={roleLabel} />
      <MobileSidebarDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        sections={sections}
        roleLabel={roleLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={authenticatedName}
          userRole={roleLabel}
          notificationsHref={notificationsHref}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
