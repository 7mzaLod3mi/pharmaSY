"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { authRepository } from "@/features/auth/auth.repository";
import { normalizeApiError } from "@/lib/http-client";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await authRepository.forgotPassword(String(form.get("email") ?? ""));
      setMessage(response.message);
    } catch (unknownError) {
      setError(normalizeApiError(unknownError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input id="email" name="email" required autoComplete="email" type="email" placeholder="you@pharmacy.com" dir="ltr" />
        </div>
        {message ? <p role="status" className="text-sm text-success-500">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
        <Button disabled={submitting} type="submit" className="w-full" size="lg">
          {submitting ? "…" : t("forgot.submit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {t("forgot.remembered")}{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          {t("forgot.back")}
        </Link>
      </p>
    </AuthLayout>
  );
}
