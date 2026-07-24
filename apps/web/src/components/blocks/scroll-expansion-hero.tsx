"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ScrollExpandHeroProps {
  mediaSrc: string;
  bgImageSrc: string;
  eyebrow?: string;
  titleFirstWord: string;
  titleRest: string;
  scrollHint: string;
  children?: ReactNode;
}

export function ScrollExpandHero({
  mediaSrc,
  bgImageSrc,
  eyebrow,
  titleFirstWord,
  titleRest,
  scrollHint,
  children,
}: ScrollExpandHeroProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const delta = e.deltaY * 0.0011;
        const next = Math.min(Math.max(scrollProgress + delta, 0), 1);
        setScrollProgress(next);
        if (next >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (next < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => setTouchStartY(e.touches[0].clientY);

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const factor = deltaY < 0 ? 0.009 : 0.006;
        const next = Math.min(Math.max(scrollProgress + deltaY * factor, 0), 1);
        setScrollProgress(next);
        if (next >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (next < 0.75) {
          setShowContent(false);
        }
        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => setTouchStartY(0);

    const handleScroll = () => {
      if (!mediaFullyExpanded) window.scrollTo(0, 0);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  const mediaWidth = 340 + scrollProgress * (isMobile ? 620 : 1180);
  const mediaHeight = 420 + scrollProgress * (isMobile ? 190 : 380);
  const textTranslate = scrollProgress * (isMobile ? 140 : 120);

  return (
    <div ref={sectionRef} className="relative overflow-x-clip">
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-start">
        <motion.div
          className="absolute inset-0 z-0 h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 - scrollProgress * 0.85 }}
          transition={{ duration: 0.1 }}
        >
          <Image
            src={bgImageSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/70 via-brand-900/50 to-background" />
        </motion.div>

        <div className="relative z-10 flex h-[100dvh] w-full flex-col items-center justify-center px-6">
          <div
            className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-xl)]"
            style={{
              width: `${mediaWidth}px`,
              height: `${mediaHeight}px`,
              maxWidth: "95vw",
              maxHeight: "82vh",
              boxShadow: "0 30px 80px -20px rgb(0 0 0 / 0.45)",
            }}
          >
            <Image
              src={mediaSrc}
              alt="PharmaSY"
              fill
              priority
              sizes="(max-width: 768px) 95vw, 1180px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/55 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            {eyebrow && (
              <motion.span
                className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-[12.5px] font-medium text-white backdrop-blur-sm"
                style={{ transform: `translateY(-${scrollProgress * 40}px)`, opacity: 1 - scrollProgress }}
              >
                {eyebrow}
              </motion.span>
            )}
            <div className="flex flex-col items-center gap-1">
              <h1
                className="text-4xl font-bold text-white drop-shadow-sm sm:text-6xl"
                style={{ transform: `translateX(-${textTranslate}px)` }}
              >
                {titleFirstWord}
              </h1>
              <h1
                className="text-4xl font-bold text-white drop-shadow-sm sm:text-6xl"
                style={{ transform: `translateX(${textTranslate}px)` }}
              >
                {titleRest}
              </h1>
            </div>
          </div>

          {!mediaFullyExpanded && (
            <motion.div
              className="animate-bounce-down absolute bottom-10 z-10 flex flex-col items-center gap-1.5 text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 - scrollProgress * 2 > 0 ? 1 - scrollProgress * 2 : 0 }}
            >
              <span className="text-[12px] font-medium">{scrollHint}</span>
              <ChevronDown className="size-4" />
            </motion.div>
          )}
        </div>

        <motion.div
          className="relative z-10 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </section>
    </div>
  );
}
