"use client";

import { motion } from "framer-motion";
import { useInViewOnce, useReducedMotion } from "./hooks";
import { cn } from "@/lib/utils";
import React from "react";
import { HTMLMotionProps } from "framer-motion";

export const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface RevealOnScrollProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function RevealOnScroll({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 30,
  className,
  ...props
}: RevealOnScrollProps) {
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
