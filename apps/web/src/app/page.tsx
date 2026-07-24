"use client";

import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { DirectionalReveal, MaskUpReveal } from "@/components/ui/motion/directional-reveal";
import { StaggerContainer } from "@/components/ui/motion/stagger-container";
import { StaggerItem } from "@/components/ui/motion/stagger-item";
import { EditorialButton } from "@/components/ui/editorial-button";
import { AnimatedNumber } from "@/components/ui/motion/animated-number";
import { useLocale } from "@/lib/i18n";
import { homeContent } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HomePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const t = homeContent[locale];
  
  // Parallax Scroll Hooks
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 400], [0, -100]);
  const titleOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const textOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Use Arabic specific typography when needed, otherwise English serif
  const headingFontClass = isAr ? "font-[family-name:var(--font-cairo)] font-bold" : "font-serif";

  return (
    <div className="min-h-screen bg-white text-foreground selection:bg-brand-600/30 font-sans">
      <PublicHeader />

      {/* Cinematic Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* TODO: Replace temporary image with final PharmaSY photography */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/hero_pharmacy.jpg" 
            alt="Pharmacy network background" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-[1800px] flex-col justify-end px-[3vw] lg:px-[3.5vw] mt-20">
          <motion.div style={{ y: titleY, opacity: titleOpacity }}>
            <DirectionalReveal direction="up" distance={20} delay={0.5} className="max-w-4xl">
              <h1 className={cn("text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] tracking-tight leading-[1.05] text-brand-900", headingFontClass)}>
                {isAr ? "عمليات متكاملة." : "Seamless operations."}
                <br />
                <span className="text-brand-600">
                  {isAr ? "يربط صيدليتك بالشبكة." : "Connecting your pharmacy."}
                </span>
              </h1>
            </DirectionalReveal>
          </motion.div>

          <motion.div style={{ opacity: textOpacity }}>
            <DirectionalReveal direction="up" distance={20} delay={0.7} className="mt-8 max-w-2xl">
              <p className="text-[17px] sm:text-[19px] leading-relaxed text-muted-foreground font-light">
                {isAr 
                  ? "عندما تتوفر الأدوية في صيدلية، يمكن لأخرى إيجادها. منصة أعمال متكاملة تدعم تبادل الأدوية، تتبع المخزون، والحد من النواقص بشكل آمن وفعّال."
                  : "When one pharmacy has it, another pharmacy can find it. A definitive B2B platform for safe medicine exchange, real-time inventory visibility, and shortage prevention."}
              </p>
            </DirectionalReveal>

            <DirectionalReveal direction="up" distance={20} delay={0.9} className="mt-14">
              <EditorialButton href="/register" variant="primary">
                {isAr ? "ابدأ الآن" : "Get Started"}
              </EditorialButton>
            </DirectionalReveal>
          </motion.div>
        </div>
      </section>

      {/* Split Section 1: Pharmacy Exchange */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-[3vw] lg:px-[3.5vw] grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-[4vw] items-center">
          {/* Image Half: Left */}
          <div className="lg:col-span-5 relative aspect-[3/4] w-full overflow-hidden">
            <DirectionalReveal direction={isAr ? "right" : "left"} duration={1.2} className="h-full w-full">
              {/* TODO: Replace temporary image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/portrait_exchange.jpg" 
                alt="Pharmacists collaborating" 
                className="h-full w-full object-cover" 
              />
            </DirectionalReveal>
          </div>

          {/* Text Half: Right */}
          <div className="lg:col-span-7 flex flex-col justify-center max-w-2xl ltr:lg:ml-auto rtl:lg:mr-auto lg:px-[2vw]">
            <MaskUpReveal>
              <h2 className={cn("text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-brand-900", headingFontClass)}>
                {isAr ? "تبادل آمن بين الصيدليات." : "Safe pharmacy-to-pharmacy exchange."}
              </h2>
            </MaskUpReveal>
            <DirectionalReveal direction="up" distance={15} delay={0.2}>
              <p className="mt-8 text-[17px] leading-relaxed text-muted-foreground font-light">
                {isAr 
                  ? "قم بتحسين إدارة المخزون وتقليل هدر الأدوية من خلال التبادل المباشر مع شبكة من الصيدليات المعتمدة. اكتشف النواقص، وراقب تواريخ الصلاحية، وتبادل الفوائض بأمان تام."
                  : "Optimize your inventory and drastically reduce medicine waste through direct exchange within a verified network. Discover shortages, track expiry dates, and move surplus stock safely."}
              </p>
            </DirectionalReveal>
            <DirectionalReveal direction="up" distance={15} delay={0.4} className="mt-12">
              <EditorialButton href="/about" variant="secondary">
                {isAr ? "تعرف على الشبكة" : "Explore the network"}
              </EditorialButton>
            </DirectionalReveal>
          </div>
        </div>
      </section>

      {/* Split Section 2: Suppliers */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-[3vw] lg:px-[3.5vw] grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-[4vw] items-center">
          {/* Text Half: Left */}
          <div className="lg:col-span-7 flex flex-col justify-center max-w-2xl order-2 lg:order-1 lg:pr-[2vw]">
            <MaskUpReveal>
              <h2 className={cn("text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-brand-900", headingFontClass)}>
                {isAr ? "ربط مباشر مع الموردين." : "Direct supplier marketplace."}
              </h2>
            </MaskUpReveal>
            <DirectionalReveal direction="up" distance={15} delay={0.2}>
              <p className="mt-8 text-[17px] leading-relaxed text-muted-foreground font-light">
                {isAr 
                  ? "نظم عمليات الشراء وتتبع الطلبات الخاصة بك في مكان واحد. تواصل مباشرة مع الموردين المعتمدين، واحصل على العروض الحصرية، واضمن استمرارية الإمدادات بدون انقطاع."
                  : "Streamline your procurement process and track orders in a single unified dashboard. Connect with verified suppliers, secure exclusive offers, and ensure a continuous supply chain."}
              </p>
            </DirectionalReveal>
            <DirectionalReveal direction="up" distance={15} delay={0.4} className="mt-12">
              <EditorialButton href="/suppliers" variant="secondary">
                {isAr ? "اكتشف الموردين" : "View Suppliers"}
              </EditorialButton>
            </DirectionalReveal>
          </div>

          {/* Image Half: Right */}
          <div className="lg:col-span-5 relative aspect-[3/4] w-full overflow-hidden order-1 lg:order-2">
            <DirectionalReveal direction={isAr ? "left" : "right"} duration={1.2} className="h-full w-full">
              {/* TODO: Replace temporary image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/portrait_supplier.jpg" 
                alt="Supplier logistics" 
                className="h-full w-full object-cover" 
              />
            </DirectionalReveal>
          </div>
        </div>
      </section>

      {/* 6-Card Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-[3vw] lg:px-[3.5vw]">
          <MaskUpReveal className="mx-auto max-w-3xl text-center">
            <h2 className={cn("text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-brand-900", headingFontClass)}>
              {isAr ? "كل ما تحتاجه صيدليتك." : "Everything your pharmacy needs."}
            </h2>
          </MaskUpReveal>

          <StaggerContainer className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: isAr ? "شبكة الصيدليات" : "Pharmacy Network",
                desc: isAr 
                  ? "تواصل مع آلاف الصيدليات المعتمدة في منطقتك، وقم ببناء علاقات تبادل موثوقة ومستدامة."
                  : "Connect with thousands of verified pharmacies in your region, building reliable exchange relationships."
              },
              {
                title: isAr ? "تبادل الأدوية" : "Medicine Exchange",
                desc: isAr 
                  ? "ابحث عن الأدوية الناقصة أو اعرض المخزون الفائض لتقليل الهدر وتحسين توفر الدواء للمرضى."
                  : "Search for shortages or list your surplus inventory to reduce waste and improve medicine availability."
              },
              {
                title: isAr ? "سوق الموردين" : "Supplier Marketplace",
                desc: isAr 
                  ? "تصفح الكتالوج الشامل، واطلب الأدوية مباشرة من الموردين بأسعار تنافسية وشفافية تامة."
                  : "Browse a comprehensive master catalog and order directly from verified suppliers with competitive pricing."
              },
              {
                title: isAr ? "إدارة المخزون" : "Inventory & Batches",
                desc: isAr 
                  ? "تتبع دقيق للمخزون، وتواريخ الصلاحية، وتنبيهات استباقية للكميات القليلة وإدارة الدفعات بفعالية."
                  : "Precise tracking of stock levels, expiry dates, and proactive alerts for low quantities and batch control."
              },
              {
                title: isAr ? "الطلبات والتسليم" : "Orders & Fulfillment",
                desc: isAr 
                  ? "نظام متكامل لمعالجة الطلبات، تتبع حالة التوصيل، وإدارة الفواتير بشكل مبسط وسريع."
                  : "An integrated system to process requests, track delivery statuses, and manage invoices smoothly."
              },
              {
                title: isAr ? "التقارير والتنبيهات" : "Reports & Alerts",
                desc: isAr 
                  ? "احصل على رؤى تفصيلية حول أداء الصيدلية، وحركات المخزون، والتقارير المالية لاتخاذ قرارات أفضل."
                  : "Gain detailed insights into pharmacy performance, inventory movements, and financial reports."
              }
            ].map((f) => (
              <StaggerItem key={f.title} className="h-full">
                <div className="group relative flex h-[300px] flex-col justify-between bg-brand-50 p-8 lg:p-10 transition-colors duration-500 hover:bg-white border border-border">
                  {/* Permanent silver accent line */}
                  <div className="absolute left-0 top-0 h-full w-1 bg-brand-300 rtl:left-auto rtl:right-0 transition-colors duration-300 group-hover:bg-brand-500" />
                  
                  <div className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
                    <h3 className={cn("text-[21px] lg:text-[24px] tracking-tight text-brand-900", headingFontClass)}>{f.title}</h3>
                    <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground font-light">{f.desc}</p>
                  </div>
                  <div className={cn("flex items-center text-[11px] font-bold uppercase text-brand-500 transition-colors group-hover:text-brand-400 mt-6", isAr ? "" : "tracking-[0.15em]")}>
                    <span className="cursor-pointer">{isAr ? "اكتشف المزيد" : "Learn More"}</span>
                    <ArrowRight className="ml-3 size-4 rtl:mr-3 rtl:ml-0 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-2 rtl:group-hover:-translate-x-2" />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-[3vw] lg:px-[3.5vw]">
          <DirectionalReveal direction="up" distance={20}>
            <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {t.stats.eyebrow}
            </p>
          </DirectionalReveal>
          <MaskUpReveal className="mt-6 max-w-3xl">
            <h2 className={cn("text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-brand-900", headingFontClass)}>
              {t.stats.title}
            </h2>
          </MaskUpReveal>
          
          <StaggerContainer className="mt-20 grid grid-cols-2 gap-x-8 gap-y-16 md:grid-cols-4 pt-10">
            {t.stats.items.map((s) => (
              <StaggerItem key={s.label}>
                <div className={cn("text-5xl md:text-6xl tracking-tighter text-brand-900", headingFontClass)}>
                  <AnimatedNumber value={s.value} />
                  <span dir="ltr" className="inline-block text-brand-500 ml-1">{s.suffix === 'M$' ? '$M' : s.suffix}</span>
                </div>
                <p className="mt-6 text-[12px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 bg-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <MaskUpReveal>
            <h2 className={cn("text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] text-brand-900", headingFontClass)}>
              {isAr ? "جاهز للانضمام؟" : "Ready to join?"}
            </h2>
          </MaskUpReveal>
          <DirectionalReveal direction="up" distance={20} delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-[18px] text-muted-foreground font-light leading-relaxed">
              {isAr 
                ? "ارتقِ بمستوى صيدليتك. تواصل، وتبادل، واطلب الأدوية بثقة تامة."
                : "Elevate your pharmacy operations. Connect, exchange, and procure medicine with absolute confidence."}
            </p>
          </DirectionalReveal>
          <DirectionalReveal direction="up" distance={20} delay={0.4} className="mt-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <EditorialButton href="/register" variant="primary">
              {isAr ? "أنشئ حسابك" : "Create Account"}
            </EditorialButton>
            <EditorialButton href="/contact" variant="secondary">
              {isAr ? "تواصل معنا" : "Contact Sales"}
            </EditorialButton>
          </DirectionalReveal>
        </div>
      </section>

      {/* Footer wrapper */}
      <div className="bg-white text-muted-foreground">
        <PublicFooter />
      </div>
    </div>
  );
}
