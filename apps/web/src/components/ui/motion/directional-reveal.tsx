"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useInViewOnce, useReducedMotion } from "./hooks";
import { cn } from "@/lib/utils";
import React from "react";

export const EASING: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface DirectionalRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  distance?: number;
  duration?: number;
}

export function DirectionalReveal({
  children,
  direction = "up",
  delay = 0,
  distance = 40,
  duration = 0.8,
  className,
  ...props
}: DirectionalRevealProps) {
  const { ref, isInView } = useInViewOnce();
  const shouldReduceMotion = useReducedMotion();

  const getInitial = () => {
    switch (direction) {
      case "left": return { x: distance, opacity: 0 };
      case "right": return { x: -distance, opacity: 0 };
      case "up": return { y: distance, opacity: 0 };
      case "down": return { y: -distance, opacity: 0 };
    }
  };

  const getAnimate = () => {
    switch (direction) {
      case "left":
      case "right": return { x: 0, opacity: 1 };
      case "up":
      case "down": return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? { opacity: 0 } : getInitial()}
      animate={isInView ? (shouldReduceMotion ? { opacity: 1 } : getAnimate()) : {}}
      transition={{ duration, delay, ease: EASING }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MaskUpReveal({
  children,
  delay = 0,
  duration = 0.8,
  className,
  ...props
}: Omit<DirectionalRevealProps, "direction" | "distance">) {
  const { ref, isInView } = useInViewOnce();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn("overflow-hidden py-1", className)}>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
        animate={isInView ? (shouldReduceMotion ? { opacity: 1 } : { y: "0%" }) : {}}
        transition={{ duration, delay, ease: EASING }}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
}
