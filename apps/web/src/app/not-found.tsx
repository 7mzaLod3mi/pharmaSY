"use client";

import { EditorialButton } from "@/components/ui/editorial-button";
import { Compass } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-[var(--radius-lg)] bg-[#111] border border-[#2e2e2e] text-brand-500">
        <Compass className="size-6" />
      </div>
      <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-brand-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("notFound.title")}</h1>
      <p className="mt-2 max-w-sm text-[13.5px] text-muted-foreground">{t("notFound.subtitle")}</p>
      <div className="mt-8">
        <EditorialButton href="/" variant="primary">
          {t("notFound.back")}
        </EditorialButton>
      </div>
    </div>
  );
}
