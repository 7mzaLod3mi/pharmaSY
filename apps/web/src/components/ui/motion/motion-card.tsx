"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useInViewOnce, useReducedMotion } from "./hooks";
import { EASING } from "./reveal-on-scroll";
import { cn } from "@/lib/utils";
import React from "react";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
}

export function MotionCard({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...props
}: MotionCardProps) {
  const { ref, isInView } = useInViewOnce();
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: 20 },
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
