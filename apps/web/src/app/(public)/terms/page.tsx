"use client";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { useLocale } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="border-b border-border py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600">
            PharmaSY
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("terms.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
            {t("terms.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="prose prose-sm prose-slate mx-auto max-w-none text-muted-foreground sm:prose-base dark:prose-invert">
            <p className="leading-relaxed">{t("terms.content")}</p>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
