"use client";

import Link from "next/link";
import { PillIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { homeContent } from "@/lib/content/home";

export function PublicFooter() {
  const { locale } = useLocale();
  const t = homeContent[locale].footer;

  return (
    <footer className="relative border-t border-border bg-transparent">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--brand-300), transparent)" }}
      />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-brand-600 text-white">
                <PillIcon className="size-4" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight">PharmaSY</span>
            </div>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
              {t.tagline}
            </p>
          </div>
          {t.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] text-foreground/80 transition-colors hover:text-brand-600"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border pt-7 text-[12.5px] text-muted-foreground sm:flex-row">
          <p>{t.copyright}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-foreground">{t.privacy}</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">{t.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
