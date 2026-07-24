"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLoaderStore } from "@/stores/loader-store";
import { PillLoader } from "@/components/shared/pill-loader";
import { useReducedMotion } from "framer-motion";

function GlobalLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoading, startLoading, stopLoading } = useLoaderStore();
  const activeGenRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  // Initial load logic
  useEffect(() => {
    // Only run once on mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      const gen = startLoading();
      activeGenRef.current = gen;
    }
  }, [startLoading]);

  // Route change completion logic
  useEffect(() => {
    if (activeGenRef.current !== null && mountedRef.current) {
      // Small delay to ensure render cycle finishes before we consider it "completed"
      // RequestAnimationFrame guarantees we painted the new route (mostly).
      requestAnimationFrame(() => {
        stopLoading(activeGenRef.current!);
      });
    }
  }, [pathname, searchParams, stopLoading]);

  // Click interception logic
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore modified clicks
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0 || e.defaultPrevented) return;

      let target = e.target as HTMLElement | null;
      let anchor: HTMLAnchorElement | null = null;
      
      // Find closest anchor tag
      while (target && target !== document.body) {
        if (target.tagName.toLowerCase() === 'a') {
          anchor = target as HTMLAnchorElement;
          break;
        }
        target = target.parentElement;
      }

      if (!anchor) return;
      if (!anchor.href) return;
      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute('download')) return;
      // Exclude disabled elements or custom controls if they have aria-disabled or similar (just in case)
      if (anchor.hasAttribute('disabled') || anchor.getAttribute('aria-disabled') === 'true') return;

      try {
        const url = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Exclude external, mailto, tel
        if (url.origin !== currentUrl.origin) return;
        if (url.protocol !== "http:" && url.protocol !== "https:") return;

        // Same route check (ignoring hash)
        const isSameRoute = url.pathname === currentUrl.pathname && url.search === currentUrl.search;
        
        if (isSameRoute) {
          // It's either a hash link or literally the exact same page, don't trigger loader
          return;
        }

        // It is a genuine internal navigation! Trigger loader.
        activeGenRef.current = startLoading();
      } catch {
        // Invalid URL, do nothing
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [startLoading]);

  // Lock body scroll while loading to block interactions and layout shifts
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
      // Prevent pointer events on the body underneath the loader overlay
      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    }
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: prefersReducedMotion ? 0 : 0.4, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0a] pointer-events-auto"
          aria-live="assertive"
          aria-modal="true"
          role="dialog"
        >
          {/* We keep the existing PillLoader unmodified. It already respects its own styling and motion requirements internally or we can assume it's fine */}
          <PillLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GlobalLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderContent />
    </Suspense>
  );
}
