"use client";

import { useInView, useReducedMotion as useFramerReducedMotion, UseInViewOptions } from "framer-motion";
import { useRef } from "react";
import { useLoaderStore } from "@/stores/loader-store";

export function useInViewOnce<T extends Element = HTMLDivElement>(options: UseInViewOptions = { once: true, margin: "-10% 0px" }) {
  const ref = useRef<T>(null);
  const rawIsInView = useInView(ref, options);
  const isLoading = useLoaderStore((s) => s.isLoading);
  
  const isInView = rawIsInView && !isLoading;
  return { ref, isInView };
}

export function useReducedMotion() {
  return useFramerReducedMotion();
}
