"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export interface AnimatedNumberProps {
  value: number;
  /** Duration in milliseconds. Longer for bigger numbers, 1500-2500ms sweet spot. */
  duration?: number;
  format?: "number" | "percent" | "currency";
  currencySymbol?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Counts up from 0 to `value` once, the first time it scrolls into view. */
export function AnimatedNumber({
  value,
  duration = 2000,
  format = "number",
  currencySymbol = "$",
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: prefersReducedMotion ? 0 : duration,
    bounce: 0,
  });

  const decimals = value % 1 !== 0 ? 1 : 0;

  const formatValue = (n: number) => {
    const rounded = Number(n.toFixed(decimals));
    const base = rounded.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (format === "currency") return `${currencySymbol}${base}`;
    if (format === "percent") return `${base}%`;
    return base;
  };

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (ref.current) ref.current.textContent = `${prefix}${formatValue(value)}${suffix}`;
      return;
    }
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = `${prefix}${formatValue(latest)}${suffix}`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spring, prefix, suffix, value, prefersReducedMotion]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      {formatValue(0)}
      {suffix}
    </motion.span>
  );
}
