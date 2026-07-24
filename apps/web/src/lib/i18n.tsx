"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "ar";

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.contact": "Contact",
    "nav.login": "Log in",
    "nav.getStarted": "Get started",

    "auth.side.eyebrow": "The Pharmacy Operating System",
    "auth.side.title": "One workspace for ordering, inventory, and supplier relationships.",
    "auth.side.point1": "Verified B2B marketplace of suppliers and pharmacies",
    "auth.side.point2": "Real-time inventory with expiry and low-stock alerts",
    "auth.side.point3": "Role-based access with a full audit trail",

    "login.title": "Log in to PharmaSY",
    "login.subtitle": "Welcome back. Enter your details to access your workspace.",
    "login.email": "Work email",
    "login.password": "Password",
    "login.forgot": "Forgot password?",
    "login.submit": "Log in",
    "login.noAccount": "Don't have a workspace?",
    "login.createOne": "Create one",
    "login.registered": "Your account was created. Check your email for the verification code, then log in.",
    "login.verified": "Your email was verified. You can now continue to organization registration.",
    "login.active": "Your account is fully active. Welcome back.",
    "login.verifyAction": "Verify email or resend the code",

    "register.title": "Create your workspace",
    "register.subtitle": "Set up your organization on PharmaSY in a few minutes.",
    "register.firstName": "First name",
    "register.lastName": "Last name",
    "register.org": "Organization name",
    "register.email": "Work email",
    "register.password": "Password",
    "register.passwordHint": "Minimum 8 characters",
    "register.submit": "Create workspace",
    "register.haveAccount": "Already have a workspace?",
    "register.login": "Log in",
    "register.success": "Account created successfully.",

    "verify.title": "Verify your email",
    "verify.subtitle": "Enter the six-digit code sent to your email.",
    "verify.email": "Email",
    "verify.code": "Verification code",
    "verify.submit": "Verify email",
    "verify.resend": "Resend code",
    "verify.back": "Back to log in",
    "verify.sent": "If verification is required, a new code has been sent.",
    "verify.success": "Email verified successfully.",

    "auth.state.emailNotVerified": "Your email is not verified yet.",
    "auth.state.organizationProfileRequired": "Your email is verified. Complete your organization profile for Admin review.",
    "auth.state.completeOrganization": "Complete it now",
    "auth.state.organizationPending": "Your email is verified and your organization is awaiting Admin approval.",
    "auth.state.organizationRejected": "Your organization registration was rejected.",
    "auth.state.accountSuspended": "Your account or organization is suspended. Contact PharmaSY support.",
    "auth.state.accountBanned": "Your account is banned. Contact PharmaSY support.",
    "auth.state.rejectionReason": "Reason",
    "auth.error.invalidCredentials": "The email or password is incorrect.",
    "auth.error.accountNotActive": "This administrator account is not active.",
    "auth.error.emailDeliveryNotConfigured": "Email verification is temporarily unavailable. Contact the platform administrator.",
    "auth.error.validation": "Please correct the highlighted account information.",
    "auth.error.network": "The server could not be reached. Check your connection and try again.",
    "auth.error.emailInvalid": "Enter a valid email address.",
    "auth.error.passwordLength": "Password must be at least 8 characters.",
    "auth.error.passwordComplexity": "Password must include uppercase, lowercase, and numeric characters.",
    "auth.error.phoneInvalid": "Enter a valid Syrian phone number.",
    "auth.error.firstNameLength": "First name must contain at least 2 characters.",
    "auth.error.lastNameLength": "Last name must contain at least 2 characters.",
    "auth.error.otpInvalid": "Enter the complete six-digit verification code.",
    "auth.error.otpExpired": "The verification code is invalid or expired.",
    "auth.error.emailInUse": "This email address is already registered.",

    "forgot.title": "Reset your password",
    "forgot.subtitle": "Enter your work email and we'll send you a reset link.",
    "forgot.submit": "Send reset link",
    "forgot.remembered": "Remembered it?",
    "forgot.back": "Back to log in",

    "notFound.title": "This page doesn't exist",
    "notFound.subtitle": "The page you're looking for may have been moved or the link may be incorrect.",
    "notFound.back": "Back to home",

    "forbidden.title": "You don't have access to this page",
    "forbidden.subtitle": "Your account role doesn't have permission to view this resource. Contact your organization admin if you think this is a mistake.",
  },
  ar: {
    "nav.home": "الرئيسية",
    "nav.features": "المزايا",
    "nav.pricing": "الأسعار",
    "nav.contact": "تواصل معنا",
    "nav.login": "تسجيل الدخول",
    "nav.getStarted": "ابدأ الآن",

    "auth.side.eyebrow": "نظام تشغيل الصيدليات",
    "auth.side.title": "مساحة عمل واحدة للطلبات والمخزون وعلاقات الموردين.",
    "auth.side.point1": "سوق إلكتروني موثّق للموردين والصيدليات",
    "auth.side.point2": "مخزون لحظي مع تنبيهات الصلاحية ونقص المخزون",
    "auth.side.point3": "صلاحيات حسب الدور مع سجل تدقيق كامل",

    "login.title": "تسجيل الدخول إلى PharmaSY",
    "login.subtitle": "أهلًا بعودتك. أدخل بياناتك للوصول إلى مساحة عملك.",
    "login.email": "البريد الإلكتروني للعمل",
    "login.password": "كلمة المرور",
    "login.forgot": "نسيت كلمة المرور؟",
    "login.submit": "تسجيل الدخول",
    "login.noAccount": "ليس لديك مساحة عمل؟",
    "login.createOne": "أنشئ واحدة",
    "login.registered": "تم إنشاء حسابك. تحقق من بريدك للحصول على رمز التحقق، ثم سجّل الدخول.",
    "login.verified": "تم تأكيد بريدك الإلكتروني. يمكنك الآن متابعة تسجيل المنظمة.",
    "login.active": "حسابك مفعّل بالكامل. أهلًا بعودتك.",
    "login.verifyAction": "تحقق من البريد أو أعد إرسال الرمز",

    "register.title": "أنشئ مساحة عملك",
    "register.subtitle": "أعدّ منظمتك على PharmaSY خلال دقائق قليلة.",
    "register.firstName": "الاسم الأول",
    "register.lastName": "اسم العائلة",
    "register.org": "اسم المنظمة",
    "register.email": "البريد الإلكتروني للعمل",
    "register.password": "كلمة المرور",
    "register.passwordHint": "8 أحرف على الأقل",
    "register.submit": "إنشاء مساحة العمل",
    "register.haveAccount": "لديك مساحة عمل بالفعل؟",
    "register.login": "تسجيل الدخول",
    "register.success": "تم إنشاء الحساب بنجاح.",

    "verify.title": "تأكيد البريد الإلكتروني",
    "verify.subtitle": "أدخل الرمز المكوّن من ستة أرقام الذي أُرسل إلى بريدك.",
    "verify.email": "البريد الإلكتروني",
    "verify.code": "رمز التحقق",
    "verify.submit": "تأكيد البريد",
    "verify.resend": "إعادة إرسال الرمز",
    "verify.back": "العودة إلى تسجيل الدخول",
    "verify.sent": "إذا كان الحساب يحتاج إلى التحقق، فقد أُرسل رمز جديد.",
    "verify.success": "تم تأكيد البريد الإلكتروني بنجاح.",

    "auth.state.emailNotVerified": "لم يتم تأكيد بريدك الإلكتروني بعد.",
    "auth.state.organizationProfileRequired": "تم تأكيد بريدك. أكمل بيانات منظمتك ليقوم المدير بمراجعتها.",
    "auth.state.completeOrganization": "أكمل البيانات الآن",
    "auth.state.organizationPending": "تم تأكيد بريدك ومنظمتك بانتظار موافقة المدير.",
    "auth.state.organizationRejected": "تم رفض طلب تسجيل منظمتك.",
    "auth.state.accountSuspended": "حسابك أو منظمتك موقوفة. تواصل مع دعم PharmaSY.",
    "auth.state.accountBanned": "حسابك محظور. تواصل مع دعم PharmaSY.",
    "auth.state.rejectionReason": "السبب",
    "auth.error.invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth.error.accountNotActive": "حساب المدير هذا غير مفعّل.",
    "auth.error.emailDeliveryNotConfigured": "خدمة تأكيد البريد غير مهيأة حاليًا. تواصل مع مدير المنصة.",
    "auth.error.validation": "يرجى تصحيح معلومات الحساب المدخلة.",
    "auth.error.network": "تعذر الوصول إلى الخادم. تحقق من الاتصال وحاول مجددًا.",
    "auth.error.emailInvalid": "أدخل عنوان بريد إلكتروني صحيحًا.",
    "auth.error.passwordLength": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    "auth.error.passwordComplexity": "يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم.",
    "auth.error.phoneInvalid": "أدخل رقم هاتف سوريًا صحيحًا.",
    "auth.error.firstNameLength": "يجب أن يتكون الاسم الأول من حرفين على الأقل.",
    "auth.error.lastNameLength": "يجب أن يتكون اسم العائلة من حرفين على الأقل.",
    "auth.error.otpInvalid": "أدخل رمز التحقق الكامل المكوّن من ستة أرقام.",
    "auth.error.otpExpired": "رمز التحقق غير صحيح أو انتهت صلاحيته.",
    "auth.error.emailInUse": "هذا البريد الإلكتروني مسجل مسبقًا.",

    "forgot.title": "إعادة تعيين كلمة المرور",
    "forgot.subtitle": "أدخل بريدك الإلكتروني للعمل وسنرسل لك رابط إعادة التعيين.",
    "forgot.submit": "إرسال رابط إعادة التعيين",
    "forgot.remembered": "تذكرت كلمة المرور؟",
    "forgot.back": "العودة لتسجيل الدخول",

    "notFound.title": "هذه الصفحة غير موجودة",
    "notFound.subtitle": "ربما تم نقل الصفحة التي تبحث عنها أو أن الرابط غير صحيح.",
    "notFound.back": "العودة للرئيسية",

    "forbidden.title": "لا تملك صلاحية الوصول لهذه الصفحة",
    "forbidden.subtitle": "دور حسابك لا يملك صلاحية عرض هذا المورد. تواصل مع مسؤول منظمتك إذا كنت تعتقد أن هذا خطأ.",
  },
};

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ar");
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", locale);
  }, [dir, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir,
      setLocale,
      t: (key: string) => dictionaries[locale][key] ?? key,
    }),
    [locale, dir]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
