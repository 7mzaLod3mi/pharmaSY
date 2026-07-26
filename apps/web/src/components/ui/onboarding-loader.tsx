"use client";

import { Loader2, Sparkles } from "lucide-react";

export function OnboardingLoader({ message }: { message: string }) {
  return (
    <div className="flex min-h-[380px] w-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 shadow-inner">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="absolute inset-0 rounded-full border border-brand-500/20 animate-ping opacity-25" />
        <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-brand-600 dark:text-brand-400 animate-pulse" />
      </div>
      <p className="text-lg font-semibold tracking-tight text-foreground transition-all duration-300">
        {message}
      </p>
      <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-12 rounded-full bg-brand-600 dark:bg-brand-400 animate-[slide_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
