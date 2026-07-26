"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OnboardingLoader } from "@/components/ui/onboarding-loader";
import { useAuth, getOnboardingRedirectPath } from "@/features/auth/auth-provider";
import { localizedAuthError } from "@/features/auth/auth-errors";
import { useLocale } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, state, verifyEmail, resendVerification } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") || user?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(
    searchParams.get("fromRegister") === "1" ? 60 : 0
  );

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (state === "authenticated" && user && user.emailVerifiedAt) {
      router.replace(getOnboardingRedirectPath(user));
    }
  }, [user, state, email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const updatedUser = await verifyEmail(email.trim().toLowerCase(), otp);
      const toastMsg =
        locale === "ar"
          ? "تم تأكيد بريدك الإلكتروني. أكمل بيانات منظمتك ليقوم المدير بمراجعتها."
          : t("onboarding.toast.verified");
      toast.success(toastMsg);
      if (updatedUser) {
        router.replace(getOnboardingRedirectPath(updatedUser));
      } else {
        router.replace("/onboarding");
      }
    } catch (unknownError: unknown) {
      const err = unknownError as { code?: string; cooldown?: number };
      if (err?.code === "EMAIL_ALREADY_VERIFIED") {
        if (user) router.replace(getOnboardingRedirectPath(user));
        else router.replace("/login");
        return;
      }
      setError(localizedAuthError(unknownError, t).message);
      setSubmitting(false);
    }
  }

  async function resend() {
    if (resending || cooldown > 0 || !email) return;
    setResending(true);
    setError("");
    try {
      await resendVerification(email.trim().toLowerCase());
      toast.success(t("verify.sent"));
      setCooldown(60);
    } catch (unknownError: unknown) {
      const err = unknownError as { cooldown?: number };
      if (err?.cooldown) {
        setCooldown(err.cooldown);
      }
      setError(localizedAuthError(unknownError, t).message);
    } finally {
      setResending(false);
    }
  }

  const isEmailReadOnly = Boolean(searchParams.get("email") || (user && user.email));

  return (
    <AuthLayout title={t("verify.title")} subtitle={t("verify.subtitle")}>
      {submitting ? (
        <OnboardingLoader message={t("onboarding.loading.verify")} />
      ) : (
        <>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("verify.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                readOnly={isEmailReadOnly}
                className={isEmailReadOnly ? "bg-muted/50 text-muted-foreground cursor-not-allowed font-mono text-sm" : ""}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="otp">{t("verify.code")}</Label>
              <Input
                id="otp"
                name="otp"
                inputMode="numeric"
                pattern="\d{6}"
                minLength={6}
                maxLength={6}
                required
                dir="ltr"
                placeholder="123456"
                className="text-center tracking-widest font-mono text-lg font-semibold"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
            </div>
            {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
            <Button disabled={submitting} type="submit" className="w-full h-11">
              {t("verify.submit")}
            </Button>
            <Button
              disabled={!email || resending || cooldown > 0}
              type="button"
              variant="outline"
              className="w-full h-11 transition-all"
              onClick={() => void resend()}
            >
              {resending ? (
                "..."
              ) : cooldown > 0 ? (
                locale === "ar" ? `إعادة إرسال الرمز (${cooldown}ث)` : `${t("verify.resend")} (${cooldown}s)`
              ) : (
                t("verify.resend")
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link className="text-brand-600 hover:underline font-medium" href="/login">
              {t("verify.back")}
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

