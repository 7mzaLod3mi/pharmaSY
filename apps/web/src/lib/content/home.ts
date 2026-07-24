export interface HomeContent {
  nav: { features: string; pricing: string; contact: string; login: string; cta: string };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scrollHint: string;
    stats: { value: number; suffix: string; label: string }[];
    previewUrl: string;
    previewStats: { label: string; value: string }[];
  };
  trustedBy: { label: string; names: string[] };
  features: {
    eyebrow: string;
    title: string;
    items: { title: string; description: string }[];
    ai: { title: string; description: string; badge: string };
  };
  stats: { eyebrow: string; title: string; items: { value: number; suffix: string; label: string }[] };
  testimonials: { title: string; items: { quote: string; name: string; company: string }[] };
  faq: { title: string; items: { q: string; a: string }[] };
  cta: { title: string; subtitle: string; primary: string; secondary: string; points: string[] };
  footer: {
    tagline: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
    copyright: string;
    privacy: string;
    terms: string;
  };
}

export const homeContent: Record<"ar" | "en", HomeContent> = {
  ar: {
    nav: {
      features: "المزايا",
      pricing: "الأسعار",
      contact: "تواصل معنا",
      login: "تسجيل الدخول",
      cta: "ابدأ الآن",
    },
    hero: {
      eyebrow: "نظام تشغيل الصيدليات",
      title: "نظام التشغيل",
      highlight: "لصيدليات العصر الحديث",
      subtitle:
        "تربط PharmaSY الصيدليات والموردين والإداريين في منصة واحدة متصلة للطلبات والمخزون والتحليلات — مصممة خصيصًا لطريقة عمل الصيدليات فعليًا، لا كمتجر إلكتروني عام.",
      ctaPrimary: "ابدأ الآن مجانًا",
      ctaSecondary: "شاهد كيف تعمل",
      scrollHint: "مرر للأسفل للاستكشاف",
      stats: [
        { value: 286, suffix: "+", label: "منظمة تعمل على المنصة" },
        { value: 97, suffix: "%", label: "معدل تلبية الطلبات" },
        { value: 1.2, suffix: "M$", label: "حجم تعاملات شهري" },
      ],
      previewUrl: "app.pharmasy.com/pharmacy/dashboard",
      previewStats: [
        { label: "طلبات مفتوحة", value: "128" },
        { label: "معدل التلبية", value: "97.4%" },
        { label: "مخزون معرّض للخطر", value: "6 أصناف" },
      ],
    },
    trustedBy: {
      label: "موثوق به من قبل شبكات صيدليات وموزعين رائدين",
      names: ["مجموعة الشفاء", "نوفا فارما", "ميدكور للتوزيع", "فيتاليس سبلاي", "كير تشين"],
    },
    features: {
      eyebrow: "كل شيء متصل",
      title: "مصممة لطريقة عمل الصيدليات الفعلية",
      items: [
        {
          title: "السوق الإلكتروني",
          description:
            "تتصفح الصيدليات كتالوجًا احترافيًا لموردين موثّقين وتضع الطلبات مباشرة — بلا اتصالات هاتفية أو جداول بيانات متناثرة.",
        },
        {
          title: "إدارة المخزون",
          description:
            "تتبّع مستويات المخزون وحركاته وتواريخ الصلاحية عبر جميع الفروع، مع تنبيهات تلقائية عند انخفاض المخزون أو اقتراب الانتهاء.",
        },
        {
          title: "وضع عدم الاتصال",
          description:
            "استمر بالعمل حتى عند انقطاع الإنترنت — تُحفظ العمليات محليًا وتُزامَن تلقائيًا فور عودة الاتصال.",
        },
        {
          title: "التحليلات",
          description:
            "افهم الطلب والهوامش وأداء الموردين عبر تقارير مصممة خصيصًا لعمليات الصيدليات.",
        },
      ],
      ai: {
        title: "عمليات مدعومة بالذكاء الاصطناعي",
        description:
          "توقّعات للطلب واقتراحات لإعادة الطلب، مبنية على سجل طلباتك ومخزونك الخاص.",
        badge: "قريبًا",
      },
    },
    stats: {
      eyebrow: "أرقام تتحدث",
      title: "منصة تنمو مع شبكات الصيدليات",
      items: [
        { value: 286, suffix: "+", label: "منظمة" },
        { value: 4120, suffix: "+", label: "مستخدم نشط" },
        { value: 1.2, suffix: "M$", label: "حجم تعاملات شهري" },
        { value: 99.9, suffix: "%", label: "نسبة التشغيل" },
      ],
    },
    testimonials: {
      title: "فرق تعمل على PharmaSY",
      items: [
        {
          quote:
            "استبدلنا أربعة جداول بيانات ومجموعة محادثة واحدة بتدفق طلبات واحد. انخفض وقت إعادة التخزين لدينا إلى النصف.",
          name: "مسؤول العمليات",
          company: "سلسلة صيدليات إقليمية",
        },
        {
          quote:
            "أخيرًا أصبح لفريق المبيعات رؤية كاملة على كل حساب صيدلية دون مطاردة الفواتير الورقية.",
          name: "مدير المبيعات",
          company: "شركة توزيع أدوية",
        },
        {
          quote:
            "وضع عدم الاتصال وحده كان كافيًا لتبرير التحوّل — فرعنا في المنطقة الصناعية لم يخسر أي عملية بيع بعد الآن.",
          name: "مدير تقنية المعلومات",
          company: "مجموعة صيدليات متعددة الفروع",
        },
      ],
    },
    faq: {
      title: "أسئلة شائعة",
      items: [
        {
          q: "هل تحل PharmaSY محل نظام نقاط البيع الحالي لدينا؟",
          a: "لا. تعمل PharmaSY جنبًا إلى جنب مع نظام نقاط البيع لديك وتركّز على المشتريات والمخزون وعلاقات الموردين بين الشركات.",
        },
        {
          q: "هل يمكن للموردين إدارة عدة حسابات صيدليات؟",
          a: "نعم. يحصل الموردون على لوحة تحكم مخصصة لإدارة الكتالوجات والأسعار والطلبات عبر كل صيدلية متصلة.",
        },
        {
          q: "ماذا يحدث إذا فقدنا الاتصال بالإنترنت؟",
          a: "تستمر سير العمل الأساسية بالعمل دون اتصال وتُزامَن تلقائيًا فور استعادة الاتصال — لا يُفقد أي شيء.",
        },
        {
          q: "هل بياناتنا معزولة عن المنظمات الأخرى؟",
          a: "تعمل كل منظمة ضمن مساحة عمل معزولة خاصة بها مع تحكم كامل بالصلاحيات حسب الدور.",
        },
      ],
    },
    cta: {
      title: "اجمع شبكة صيدلياتك على منصة واحدة",
      subtitle: "أنشئ مساحة العمل خاصتك خلال دقائق. لا حاجة لبطاقة ائتمان أثناء التجربة.",
      primary: "أنشئ مساحة عملك",
      secondary: "تحدث مع المبيعات",
      points: ["صلاحيات حسب الدور", "يعمل بلا اتصال", "جاهز للتدقيق"],
    },
    footer: {
      tagline:
        "نظام تشغيل الصيدليات الذي يربط الصيدليات والموردين والإداريين على منصة واحدة.",
      columns: [
        {
          title: "المنتج",
          links: [
            { label: "السوق الإلكتروني", href: "/#features" },
            { label: "إدارة المخزون", href: "/#features" },
            { label: "التحليلات", href: "/#features" },
            { label: "الأسعار", href: "/pricing" },
          ],
        },
        {
          title: "الشركة",
          links: [
            { label: "من نحن", href: "/about" },
            { label: "تواصل معنا", href: "/contact" },
          ],
        },
        {
          title: "الحساب",
          links: [
            { label: "تسجيل الدخول", href: "/login" },
            { label: "إنشاء حساب", href: "/register" },
          ],
        },
      ],
      copyright: "© 2026 PharmaSY. جميع الحقوق محفوظة.",
      privacy: "الخصوصية",
      terms: "الشروط",
    },
  },
  en: {
    nav: { features: "Features", pricing: "Pricing", contact: "Contact", login: "Log in", cta: "Get started" },
    hero: {
      eyebrow: "The Pharmacy Operating System",
      title: "The operating system",
      highlight: "for modern pharmacies",
      subtitle:
        "PharmaSY links pharmacies, suppliers, and administrators in one connected platform for ordering, inventory, and analytics — built for how pharmacy businesses actually operate, not as a generic online store.",
      ctaPrimary: "Get started free",
      ctaSecondary: "See how it works",
      scrollHint: "Scroll to explore",
      stats: [
        { value: 286, suffix: "+", label: "organizations on the platform" },
        { value: 97, suffix: "%", label: "order fill rate" },
        { value: 1.2, suffix: "M$", label: "monthly GMV" },
      ],
      previewUrl: "app.pharmasy.com/pharmacy/dashboard",
      previewStats: [
        { label: "Open orders", value: "128" },
        { label: "Fill rate", value: "97.4%" },
        { label: "Stock at risk", value: "6 SKUs" },
      ],
    },
    trustedBy: {
      label: "Trusted by leading pharmacy networks and distributors",
      names: ["Al-Shifa Group", "Nova Pharma", "MedCore Distribution", "Vitalis Supply", "Care Chain"],
    },
    features: {
      eyebrow: "Everything connected",
      title: "Built for how pharmacy operations really work",
      items: [
        {
          title: "Marketplace",
          description:
            "Pharmacies browse a professional catalog of verified suppliers and place orders directly — no phone calls or scattered spreadsheets.",
        },
        {
          title: "Inventory",
          description:
            "Track stock levels, movements, and expiry dates across every branch, with automatic low-stock and expiry alerts.",
        },
        {
          title: "Offline mode",
          description:
            "Keep working through connectivity drops — actions queue locally and sync automatically the moment you're back online.",
        },
        {
          title: "Analytics",
          description:
            "Understand demand, margins, and supplier performance with reporting built for pharmacy operations.",
        },
      ],
      ai: {
        title: "AI-assisted operations",
        description:
          "Demand forecasting and reorder suggestions, generated from your own order and inventory history.",
        badge: "Coming soon",
      },
    },
    stats: {
      eyebrow: "Numbers that speak",
      title: "A platform that grows with pharmacy networks",
      items: [
        { value: 286, suffix: "+", label: "Organizations" },
        { value: 4120, suffix: "+", label: "Active users" },
        { value: 1.2, suffix: "M$", label: "Monthly GMV" },
        { value: 99.9, suffix: "%", label: "Uptime" },
      ],
    },
    testimonials: {
      title: "Teams running on PharmaSY",
      items: [
        {
          quote:
            "We replaced four spreadsheets and a group chat with one order flow. Our restock time dropped by half.",
          name: "Operations Lead",
          company: "Regional pharmacy chain",
        },
        {
          quote:
            "Our sales team finally has visibility into every pharmacy account without chasing paper invoices.",
          name: "Sales Director",
          company: "Pharmaceutical distributor",
        },
        {
          quote:
            "The offline mode alone justified the switch — our branch in the industrial zone never loses a sale now.",
          name: "IT Manager",
          company: "Multi-branch pharmacy group",
        },
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "Does PharmaSY replace our existing POS system?",
          a: "No. PharmaSY sits alongside your point-of-sale system and focuses on B2B procurement, inventory, and supplier relationships.",
        },
        {
          q: "Can suppliers manage multiple pharmacy accounts?",
          a: "Yes. Suppliers get a dedicated dashboard to manage catalogs, pricing, and orders across every connected pharmacy.",
        },
        {
          q: "What happens if we lose internet connectivity?",
          a: "Core workflows keep working offline and sync automatically once the connection is restored — nothing is lost.",
        },
        {
          q: "Is our data isolated from other organizations?",
          a: "Every organization operates in its own isolated workspace with role-based access control.",
        },
      ],
    },
    cta: {
      title: "Bring your pharmacy network onto one platform",
      subtitle: "Set up your workspace in minutes. No credit card required during onboarding.",
      primary: "Create your workspace",
      secondary: "Talk to sales",
      points: ["Role-based access", "Offline-first", "Audit-ready"],
    },
    footer: {
      tagline:
        "The pharmacy operating system connecting pharmacies, suppliers, and administrators on one platform.",
      columns: [
        {
          title: "Product",
          links: [
            { label: "Marketplace", href: "/#features" },
            { label: "Inventory", href: "/#features" },
            { label: "Analytics", href: "/#features" },
            { label: "Pricing", href: "/pricing" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ],
        },
        {
          title: "Account",
          links: [
            { label: "Log in", href: "/login" },
            { label: "Create account", href: "/register" },
          ],
        },
      ],
      copyright: "© 2026 PharmaSY. All rights reserved.",
      privacy: "Privacy",
      terms: "Terms",
    },
  },
};
