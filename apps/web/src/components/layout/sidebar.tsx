"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PillIcon } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  sections: NavSection[];
  roleLabel: string;
  homeHref: string;
  onNavigate?: () => void;
}

/** Shared nav content — used by both the desktop rail and the mobile drawer. */
export function SidebarNav({ sections, roleLabel, homeHref, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));

  return (
    <>
      <Link
        href={homeHref}
        aria-label="Go to home"
        onClick={onNavigate}
        className="flex h-15 shrink-0 cursor-pointer items-center gap-2 border-b border-border px-5"
      >
        <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-brand-600 text-white">
          <PillIcon className="size-4" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">PharmaSY</span>
      </Link>

      <div className="border-b border-border px-5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Workspace
        </p>
        <p className="text-[13px] font-medium text-foreground">{roleLabel}</p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] border-s-2 border-s-transparent px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-200",
                      active
                        ? "border-s-brand-500 bg-[#1a1a1a] text-white"
                        : "text-muted-foreground hover:bg-surface-elevated hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4",
                        active ? "text-brand-500" : "text-muted-foreground group-hover:text-white"
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/pharmacy/cart" && cartCount > 0 ? (
                      <span className="rounded-full bg-brand-900/40 border border-brand-800/50 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand-400">
                        {cartCount}
                      </span>
                    ) : (
                      item.badge && (
                        <span className="rounded-full bg-brand-900/40 border border-brand-800/50 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand-400">
                          {item.badge}
                        </span>
                      )
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar({ sections, roleLabel }: { sections: NavSection[]; roleLabel: string }) {
  const homeHref = sections[0]?.items[0]?.href ?? "/";
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <SidebarNav sections={sections} roleLabel={roleLabel} homeHref={homeHref} />
    </aside>
  );
}
