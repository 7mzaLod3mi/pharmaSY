"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "./motion/hooks";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Only enable on marketing pages
  const isMarketingPage = ["/", "/about", "/contact"].includes(pathname);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (!isMarketingPage || prefersReducedMotion || typeof window === "undefined" || "ontouchstart" in window) {
      setIsVisible(false);
      return;
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isMarketingPage, prefersReducedMotion, cursorX, cursorY, isVisible]);

  if (!isMarketingPage || prefersReducedMotion) return null;

  return (
    <motion.div
      style={{
        translateX: smoothX,
        translateY: smoothY,
        opacity: isVisible ? 1 : 0,
      }}
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-red-500 pointer-events-none z-50 transition-opacity duration-300"
    />
  );
}
