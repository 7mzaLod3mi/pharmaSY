"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OnboardingLoader } from "@/components/ui/onboarding-loader";
import { dashboardPathForRole, useAuth } from "@/features/auth/auth-provider";
import { organizationRepository } from "@/features/organizations/organization.repository";
import { localizedAuthError } from "@/features/auth/auth-errors";
import { useLocale } from "@/lib/i18n";
import { AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, user, refreshProfile } = useAuth();
  const { t, locale } = useLocale();

  const [name, setName] = useState(user?.orgName || "");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.orgName && !name) setName(user.orgName);
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user, name, phone]);

  useEffect(() => {
    if (state === "anonymous") {
      router.replace("/login");
      return;
    }
    if (state === "authenticated" && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }
      if (!user.emailVerifiedAt || user.accountState === "EMAIL_NOT_VERIFIED") {
        router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
        return;
      }
      const orgStatus = user.orgStatus ?? user.pharmacy?.status ?? user.supplier?.status;
      if (orgStatus === "PENDING" || user.accountState === "ORGANIZATION_PENDING") {
        router.replace("/");
        return;
      }
      if (orgStatus === "APPROVED" || user.accountState === "ACTIVE") {
        router.replace(dashboardPathForRole(user.role));
        return;
      }
    }
  }, [router, state, user]);

  if (state === "loading" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground animate-pulse">
        {locale === "ar" ? "جارٍ التحميل..." : "Loading…"}
      </div>
    );
  }

  const orgStatus = user.orgStatus ?? user.pharmacy?.status ?? user.supplier?.status;
  const isRejected = orgStatus === "REJECTED" || user.accountState === "ORGANIZATION_REJECTED";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await organizationRepository.create(user, {
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
      });
      await refreshProfile();
      const toastMsg =
        locale === "ar"
          ? "تم تأكيد بريدك الإلكتروني، ومنظمتك الآن بانتظار موافقة المدير."
          : t("onboarding.toast.orgSubmitted");
      toast.success(toastMsg);
      router.replace("/");
    } catch (unknownError) {
      setError(localizedAuthError(unknownError, t).message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={locale === "ar" ? "أكمل ملف منظمتك" : "Complete organization profile"}
      subtitle={
        locale === "ar"
          ? "أدخل البيانات القانونية المطلوبة ليقوم مدير المنصة بمراجعتها وتفعيل حسابك."
          : "Provide the legal organization details required for administrator review."
      }
    >
      {submitting ? (
        <OnboardingLoader message={t("onboarding.loading.submitOrg")} />
      ) : (
        <>
          {isRejected && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-danger-500/20 bg-danger-50 p-4 text-sm text-danger-800 dark:bg-danger-950/40 dark:text-danger-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {locale === "ar" ? "تم رفض طلب التسجيل السابق" : t("auth.state.organizationRejected")}
                </p>
                {user.organizationRejectionReason && (
                  <p className="text-xs text-danger-700 dark:text-danger-400">
                    {locale === "ar" ? "السبب:" : t("auth.state.rejectionReason")}: {user.organizationRejectionReason}
                  </p>
                )}
                <p className="text-xs font-medium pt-1">
                  {locale === "ar"
                    ? "يرجى تصحيح البيانات وأعِد تقديم الطلب للمراجعة من جديد."
                    : "Please correct your organization details and resubmit for approval."}
                </p>
              </div>
            </div>
          )}
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="name">{locale === "ar" ? "اسم المنظمة" : "Organization name"}</Label>
              <Input
                id="name"
                name="name"
                minLength={2}
                required
                placeholder={user.role === "PHARMACY" ? "صيدلية النور" : "مستودع الأمل"}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registrationNumber">
                {user.role === "PHARMACY"
                  ? locale === "ar"
                    ? "رقم الترخيص الصيدلي"
                    : "License number"
                  : locale === "ar"
                  ? "رقم السجل التجاري"
                  : "Trade register"}
              </Label>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                minLength={3}
                required
                dir="ltr"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">{locale === "ar" ? "العنوان بالتفصيل" : "Address"}</Label>
              <Input
                id="address"
                name="address"
                minLength={5}
                required
                placeholder="شارع بغداد، بناء الصحة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">{locale === "ar" ? "المدينة" : "City"}</Label>
                <Input
                  id="city"
                  name="city"
                  minLength={2}
                  required
                  placeholder="دمشق"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">{locale === "ar" ? "رقم الهاتف" : "Phone"}</Label>
                <Input
                  id="phone"
                  name="phone"
                  minLength={8}
                  required
                  dir="ltr"
                  placeholder="011-2345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
            <Button className="w-full h-11" disabled={submitting} type="submit">
              {locale === "ar" ? "إرسال للمراجعة" : "Submit for approval"}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

