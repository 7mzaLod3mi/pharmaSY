"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useInViewOnce, useReducedMotion } from "./hooks";
import { EASING } from "./reveal-on-scroll";
import { cn } from "@/lib/utils";
import React from "react";

interface ImageRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function ImageReveal({
  children,
  delay = 0,
  duration = 0.9,
  className,
  ...props
}: ImageRevealProps) {
  const { ref, isInView } = useInViewOnce();
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { clipPath: "inset(100% 0% 0% 0%)" },
    visible: {
      clipPath: "inset(0% 0% 0% 0%)",
      transition: {
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASING,
      },
    },
  };

  const imageVariants = {
    hidden: { scale: 1.05 },
    visible: {
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : duration * 1.5,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASING,
      },
    },
  };

  if (prefersReducedMotion) {
    return <motion.div className={cn("overflow-hidden", className)} {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={cn("overflow-hidden inline-block", className)}
      {...props}
    >
      <motion.div variants={imageVariants} className="w-full h-full">
        {children}
      </motion.div>
    </motion.div>
  );
}
