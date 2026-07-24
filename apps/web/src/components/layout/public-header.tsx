"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PillIcon, Globe, ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EditorialButton } from "@/components/ui/editorial-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n";
import { homeContent } from "@/lib/content/home";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { locale, setLocale } = useLocale();
  const t = homeContent[locale];
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#features", label: t.nav.features },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-black/90 backdrop-blur-md py-3 lg:py-4" 
          : "bg-transparent py-5 lg:py-6"
      )}
    >
      {/* Ultra-thin hairline border mimicking the cards */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 w-full h-[1px] bg-[#454545] origin-bottom transition-all duration-300",
          scrolled ? "opacity-100 scale-y-[0.6]" : "opacity-0 scale-y-0"
        )} 
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-brand-600 text-white">
            <PillIcon className="size-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">PharmaSY</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-4 py-2 text-[11.5px] font-bold uppercase transition-colors hover:text-white link-underline",
                  locale === "ar" ? "" : "tracking-[0.15em]",
                  scrolled ? "text-[#C7C7C7]" : "text-white"
                )}
              >
                {l.label}
              </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-none px-2 text-[13px] font-medium text-[#C7C7C7] transition-colors duration-200 hover:text-white focus:outline-none sm:flex">
              <Globe className="size-4" />
              {locale === "ar" ? "AR" : "EN"}
              <ChevronDown className="size-3.5 text-[#C7C7C7]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black border-[#2a2a2a] text-[#C7C7C7]">
              <DropdownMenuItem onSelect={() => setLocale("ar")} className="cursor-pointer text-white focus:bg-white/10 focus:text-white">العربية</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLocale("en")} className="cursor-pointer text-white focus:bg-white/10 focus:text-white">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-[11.5px] font-bold uppercase tracking-[0.15em] text-[#C7C7C7] hover:bg-transparent hover:text-white" asChild>
            <Link href="/login">{t.nav.login}</Link>
          </Button>
          <EditorialButton 
            href="/register" 
            variant="primary" 
            showArrow={false}
            className="hidden sm:inline-flex h-9 w-auto px-6 rounded-sm"
          >
            {t.nav.cta}
          </EditorialButton>

          <button
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-none text-[#C7C7C7] hover:text-white transition-colors duration-200 md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10 bg-[#0a0a0a] md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-none px-3 py-2.5 text-[14px] font-medium text-[#C7C7C7] hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-[#2a2a2a] pt-3">
                <Button variant="ghost" size="sm" className="flex-1 text-[11.5px] font-bold uppercase tracking-[0.15em] text-[#C7C7C7] hover:bg-transparent hover:text-white" asChild>
                  <Link href="/login">{t.nav.login}</Link>
                </Button>
                <EditorialButton 
                  href="/register" 
                  variant="primary" 
                  showArrow={false}
                  className="flex-1 h-9 w-auto px-5 rounded-sm"
                >
                  {t.nav.cta}
                </EditorialButton>
              </div>
              <button
                onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
                className="mt-1 flex cursor-pointer items-center gap-1.5 self-start rounded-none px-3 py-2 text-[11.5px] font-bold uppercase tracking-[0.15em] text-[#C7C7C7] transition-colors duration-200 hover:bg-transparent hover:text-white"
              >
                <Globe className="size-4" /> {locale === "ar" ? "English" : "العربية"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
