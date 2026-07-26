"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input, Label } from "@/components/ui/input";
import { EditorialButton } from "@/components/ui/editorial-button";
import { OnboardingLoader } from "@/components/ui/onboarding-loader";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";
import { localizedAuthError } from "@/features/auth/auth-errors";

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<"PHARMACY" | "SUPPLIER">("PHARMACY");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      await register({
        email: cleanEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      router.replace(
        `/verify-email?email=${encodeURIComponent(cleanEmail)}&fromRegister=1`
      );
    } catch (unknownError) {
      setError(localizedAuthError(unknownError, t).message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("register.title")} subtitle={t("register.subtitle")}>
      {submitting ? (
        <OnboardingLoader message={t("onboarding.loading.register")} />
      ) : (
        <>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-1.5 text-sm text-muted-foreground">Account type</legend>
              {(["PHARMACY", "SUPPLIER"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setRole(value)}
                  className={`rounded-sm border px-3 py-2 text-sm ${
                    role === value
                      ? "border-brand-600 bg-brand-600/10 text-brand-600"
                      : "border-border"
                  }`}
                >
                  {value === "PHARMACY" ? "Pharmacy" : "Supplier"}
                </button>
              ))}
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{t("register.firstName")}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  minLength={2}
                  autoComplete="given-name"
                  placeholder="سارة"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{t("register.lastName")}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  minLength={2}
                  autoComplete="family-name"
                  placeholder="أحمد"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                autoComplete="tel"
                dir="ltr"
                placeholder="+963912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input
                id="email"
                name="email"
                required
                autoComplete="email"
                type="email"
                placeholder="you@pharmacy.com"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input
                id="password"
                name="password"
                required
                autoComplete="new-password"
                minLength={8}
                type="password"
                placeholder="Uppercase, lowercase and number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
            <EditorialButton
              disabled={submitting}
              type="submit"
              variant="primary"
              showArrow={false}
              className="w-full h-12 rounded-sm border-none mt-2"
            >
              {t("register.submit")}
            </EditorialButton>
          </form>
          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {t("register.haveAccount")}{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              {t("register.login")}
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

