"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { dashboardPathForRole, useAuth } from "@/features/auth/auth-provider";
import { organizationRepository } from "@/features/organizations/organization.repository";
import { localizedAuthError } from "@/features/auth/auth-errors";
import { useLocale } from "@/lib/i18n";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, user, refreshProfile } = useAuth();
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (state === "anonymous") router.replace("/login");
    if (user?.role === "ADMIN") router.replace("/admin/dashboard");
  }, [router, state, user]);

  if (state === "loading" || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading…</div>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      await organizationRepository.create(user, {
        name: String(form.get("name") ?? ""),
        registrationNumber: String(form.get("registrationNumber") ?? ""),
        address: String(form.get("address") ?? ""),
        city: String(form.get("city") ?? ""),
        phone: String(form.get("phone") ?? ""),
      });
      await refreshProfile();
      router.replace(dashboardPathForRole(user.role));
    } catch (unknownError) {
      setError(localizedAuthError(unknownError, t).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Complete organization profile" subtitle="Provide the legal organization details required for administrator review.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5"><Label htmlFor="name">Organization name</Label><Input id="name" name="name" minLength={2} required /></div>
        <div className="space-y-1.5"><Label htmlFor="registrationNumber">{user.role === "PHARMACY" ? "License number" : "Trade register"}</Label><Input id="registrationNumber" name="registrationNumber" minLength={3} required dir="ltr" /></div>
        <div className="space-y-1.5"><Label htmlFor="address">Address</Label><Input id="address" name="address" minLength={5} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="city">City</Label><Input id="city" name="city" minLength={2} required /></div>
          <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" minLength={8} required dir="ltr" /></div>
        </div>
        {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "…" : "Submit for approval"}</Button>
      </form>
    </AuthLayout>
  );
}
