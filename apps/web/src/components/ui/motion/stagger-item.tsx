"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "./hooks";
import { EASING } from "./reveal-on-scroll";
import { cn } from "@/lib/utils";
import React from "react";

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  yOffset?: number;
  duration?: number;
}

export function StaggerItem({
  children,
  yOffset = 20,
  duration = 0.6,
  className,
  ...props
}: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        ease: EASING,
      },
    },
  };

  return (
    <motion.div variants={variants} className={cn(className)} {...props}>
      {children}
    </motion.div>
  );
}
