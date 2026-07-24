"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { SidebarNav, type NavSection } from "./sidebar";

export function MobileSidebarDrawer({
  open,
  onClose,
  sections,
  roleLabel,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
  roleLabel: string;
}) {
  const homeHref = sections[0]?.items[0]?.href ?? "/";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 cursor-pointer bg-brand-900/15 backdrop-blur-[2px] md:hidden"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-brand-800 bg-brand-900 md:hidden"
          >
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute end-3 top-4 flex size-8 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-brand-200/70 hover:bg-brand-800 hover:text-white"
            >
              <X className="size-4.5" />
            </button>
            <SidebarNav sections={sections} roleLabel={roleLabel} homeHref={homeHref} onNavigate={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
