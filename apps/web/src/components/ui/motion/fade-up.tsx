"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useInViewOnce, useReducedMotion } from "./hooks";
import { EASING } from "./reveal-on-scroll";
import { cn } from "@/lib/utils";
import React from "react";

interface FadeUpProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function FadeUp({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 30,
  className,
  ...props
}: FadeUpProps) {
  const { ref, isInView } = useInViewOnce();
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASING,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
