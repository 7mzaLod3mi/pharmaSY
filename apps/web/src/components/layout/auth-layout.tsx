"use client";

import Link from "next/link";
import { PillIcon, ShieldCheck, Boxes, Store, Globe, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 py-12 sm:px-16">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-brand-600 text-white">
              <PillIcon className="size-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">PharmaSY</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-[13px] font-medium text-foreground/70 transition-colors duration-200 hover:bg-white/[0.05] focus:outline-none">
              <Globe className="size-3.5" />
              {locale === "ar" ? "AR" : "EN"}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setLocale("ar")}>العربية</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLocale("en")}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-[#030303] lg:flex lg:flex-col lg:justify-center lg:px-16 border-s border-border">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(800px circle at 0% 50%, hsl(355 74% 52% / 0.1), transparent)",
          }}
        />
        <div className="relative">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-300">
            {t("auth.side.eyebrow")}
          </p>
          <h2 className="mt-3 max-w-sm text-2xl font-semibold leading-snug text-white">
            {t("auth.side.title")}
          </h2>
          <div className="mt-10 space-y-5">
            {[
              { icon: Store, text: t("auth.side.point1") },
              { icon: Boxes, text: t("auth.side.point2") },
              { icon: ShieldCheck, text: t("auth.side.point3") },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/10 text-brand-200">
                  <f.icon className="size-4" />
                </div>
                <p className="text-[13.5px] leading-relaxed text-white/75">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
