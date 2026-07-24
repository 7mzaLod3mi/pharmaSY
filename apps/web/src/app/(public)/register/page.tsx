"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input, Label } from "@/components/ui/input";
import { EditorialButton } from "@/components/ui/editorial-button";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/features/auth/auth-provider";
import { localizedAuthError } from "@/features/auth/auth-errors";

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<"PHARMACY" | "SUPPLIER">("PHARMACY");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      await register({
        email,
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        password: String(form.get("password") ?? ""),
        role,
      });
      router.replace(
        `/login?registered=1&email=${encodeURIComponent(email)}`,
      );
    } catch (unknownError) {
      setError(localizedAuthError(unknownError, t).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("register.title")} subtitle={t("register.subtitle")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1.5 text-sm text-muted-foreground">Account type</legend>
          {(["PHARMACY", "SUPPLIER"] as const).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setRole(value)}
              className={`rounded-sm border px-3 py-2 text-sm ${role === value ? "border-brand-600 bg-brand-600/10 text-brand-600" : "border-border"}`}
            >
              {value === "PHARMACY" ? "Pharmacy" : "Supplier"}
            </button>
          ))}
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">{t("register.firstName")}</Label>
            <Input id="firstName" name="firstName" required minLength={2} autoComplete="given-name" placeholder="سارة" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">{t("register.lastName")}</Label>
            <Input id="lastName" name="lastName" required minLength={2} autoComplete="family-name" placeholder="أحمد" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" autoComplete="tel" dir="ltr" placeholder="+963912345678" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("register.email")}</Label>
          <Input id="email" name="email" required autoComplete="email" type="email" placeholder="you@pharmacy.com" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("register.password")}</Label>
          <Input id="password" name="password" required autoComplete="new-password" minLength={8} type="password" placeholder="Uppercase, lowercase and number" />
        </div>
        {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
        <EditorialButton disabled={submitting} type="submit" variant="primary" showArrow={false} className="w-full h-12 rounded-sm border-none mt-2">
          {submitting ? "…" : t("register.submit")}
        </EditorialButton>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          {t("register.login")}
        </Link>
      </p>
    </AuthLayout>
  );
}
