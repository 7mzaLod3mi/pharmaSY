"use client";

import { ChevronDown, Globe, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

export function Topbar({
  userName,
  userRole,
  notificationsHref,
  onMenuClick,
}: {
  userName: string;
  userRole: string;
  notificationsHref: string;
  onMenuClick?: () => void;
}) {
  const { locale, setLocale } = useLocale();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex h-15 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-5">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors duration-200 hover:bg-white/[0.05] md:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search orders, products, pharmacies…" className="ps-9" />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong px-2.5 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-white/[0.05] focus:outline-none sm:flex">
            <Globe className="size-4" />
            {locale === "en" ? "EN" : "AR"}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setLocale("en")}>English</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLocale("ar")}>العربية</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell notificationsHref={notificationsHref} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] border border-border-strong py-1.5 ps-1.5 pe-2.5 transition-colors duration-200 hover:bg-white/[0.05] focus:outline-none">
            <div className="flex size-6.5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
              {userName.charAt(0)}
            </div>
            <div className="hidden text-start sm:block">
              <p className="text-[13px] font-medium leading-tight">{userName}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{userRole}</p>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => void logout().then(() => router.replace("/login"))}
              className="text-danger-500 data-[highlighted]:bg-[#1a0a0a] data-[highlighted]:text-danger-400"
            >
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
