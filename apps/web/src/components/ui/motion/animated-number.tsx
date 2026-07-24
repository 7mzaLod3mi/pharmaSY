"use client";

import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { useInViewOnce, useReducedMotion } from "./hooks";

export function AnimatedNumber({
  value,
  duration = 2,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const { ref, isInView } = useInViewOnce();
  const prefersReducedMotion = useReducedMotion();
  const count = useSpring(0, { stiffness: 50, damping: 20, duration: duration * 1000 });
  const display = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (isInView) {
      if (prefersReducedMotion) {
        count.set(value);
      } else {
        animate(count, value, { duration });
      }
    }
  }, [isInView, value, prefersReducedMotion, count, duration]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
