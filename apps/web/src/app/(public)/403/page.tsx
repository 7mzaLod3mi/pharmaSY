"use client";

import { EditorialButton } from "@/components/ui/editorial-button";
import { ShieldAlert } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export default function ForbiddenPage() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-[var(--radius-lg)] bg-danger-50 border border-danger-100 text-danger-500">
        <ShieldAlert className="size-6" />
      </div>
      <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-danger-500">403</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("forbidden.title")}</h1>
      <p className="mt-2 max-w-sm text-[13.5px] text-muted-foreground">{t("forbidden.subtitle")}</p>
      <div className="mt-8">
        <EditorialButton href="/" variant="primary">
          {t("notFound.back")}
        </EditorialButton>
      </div>
    </div>
  );
}
