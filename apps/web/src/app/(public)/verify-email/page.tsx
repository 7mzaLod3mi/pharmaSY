"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authRepository } from "@/features/auth/auth.repository";
import { localizedAuthError } from "@/features/auth/auth-errors";
import { useLocale } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = String(new FormData(event.currentTarget).get("otp") ?? "");
    setSubmitting(true);
    setError("");
    try {
      await authRepository.verifyEmail(email, otp);
      setMessage(t("verify.success"));
      router.replace(`/login?verified=1&email=${encodeURIComponent(email)}`);
    } catch (unknownError) {
      setError(localizedAuthError(unknownError, t).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError("");
    try {
      await authRepository.resendVerification(email);
      setMessage(t("verify.sent"));
    } catch (unknownError) {
      setError(localizedAuthError(unknownError, t).message);
    }
  }

  return (
    <AuthLayout title={t("verify.title")} subtitle={t("verify.subtitle")}>
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("verify.email")}</Label>
          <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="otp">{t("verify.code")}</Label>
          <Input id="otp" name="otp" inputMode="numeric" pattern="\d{6}" minLength={6} maxLength={6} required dir="ltr" />
        </div>
        {message ? <p role="status" className="text-sm text-success-500">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
        <Button disabled={submitting} type="submit" className="w-full">{t("verify.submit")}</Button>
        <Button disabled={!email} type="button" variant="outline" className="w-full" onClick={() => void resend()}>{t("verify.resend")}</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link className="text-brand-600 hover:underline" href="/login">{t("verify.back")}</Link></p>
    </AuthLayout>
  );
}
