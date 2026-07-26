"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input, Label } from "@/components/ui/input";
import { EditorialButton } from "@/components/ui/editorial-button";
import { useLocale } from "@/lib/i18n";
import { getOnboardingRedirectPath, useAuth } from "@/features/auth/auth-provider";
import type { ApiError } from "@/lib/http-client";
import { localizedAuthError } from "@/features/auth/auth-errors";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ detail: ApiError; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registered = params.get("registered") === "1";
    const verified = params.get("verified") === "1";
    const registeredEmail = params.get("email");
    if (registeredEmail) setEmail(registeredEmail);
    if (registered) toast.success(t("login.registered"));
    if (verified) toast.success(t("login.verified"));
    if (registered || verified) window.history.replaceState({}, "", "/login");
  }, [t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login({ email, password });
      if (user.accountState === "ORGANIZATION_PROFILE_REQUIRED") {
        toast.info(t("auth.state.organizationProfileRequired"));
      } else if (user.accountState === "ORGANIZATION_PENDING") {
        toast.info(t("auth.state.organizationPending"));
      } else if (user.accountState === "ORGANIZATION_REJECTED") {
        toast.error(
          `${t("auth.state.organizationRejected")}${
            user.organizationRejectionReason
              ? ` ${t("auth.state.rejectionReason")}: ${user.organizationRejectionReason}`
              : ""
          }`,
        );
      } else {
        toast.success(t("login.active"));
      }
      router.replace(getOnboardingRedirectPath(user));
    } catch (unknownError) {
      const localized = localizedAuthError(unknownError, t);
      setError({ detail: localized.error, message: localized.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("login.title")} subtitle={t("login.subtitle")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@pharmacy.com" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.password")}</Label>
            <Link href="/forgot-password" className="text-[12.5px] font-medium text-brand-600 hover:underline">
              {t("login.forgot")}
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
        </div>
        {error ? (
          <div role="alert" className="space-y-1 text-sm text-danger-500">
            <p>{error.message}</p>
            {error.detail.code === "EMAIL_NOT_VERIFIED" ? (
              <Link
                className="inline-block font-medium text-brand-600 underline"
                href={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
              >
                {t("login.verifyAction")}
              </Link>
            ) : null}
          </div>
        ) : null}
        <EditorialButton disabled={submitting} type="submit" variant="primary" showArrow={false} className="w-full h-12 rounded-sm border-none mt-2">
          {submitting ? "…" : t("login.submit")}
        </EditorialButton>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          {t("login.createOne")}
        </Link>
      </p>
    </AuthLayout>
  );
}
