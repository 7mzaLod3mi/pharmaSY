"use client";

import { motion } from "framer-motion";
import { useInViewOnce, useReducedMotion } from "./hooks";
import { EASING } from "./reveal-on-scroll";
import { cn } from "@/lib/utils";
import React from "react";

interface TextRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  children?: React.ReactNode;
  delay?: number;
  duration?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function TextReveal({
  text,
  children,
  delay = 0,
  duration = 0.8,
  className,
  ...props
}: TextRevealProps) {
  const { ref, isInView } = useInViewOnce();
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : "100%" },
    visible: {
      opacity: 1,
      y: "0%",
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASING,
      },
    },
  };

  return (
    <span
      className={cn("inline-block overflow-hidden align-bottom", className)}
      ref={ref}
      {...props}
    >
      <motion.span
        className="inline-block"
        variants={variants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {text || children}
      </motion.span>
    </span>
  );
}
