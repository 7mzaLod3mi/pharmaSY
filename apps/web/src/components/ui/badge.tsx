import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium leading-5",
  {
    variants: {
      variant: {
        neutral: "bg-[#1a1a1a] text-foreground/80 border border-[#333]",
        brand: "bg-brand-900/40 text-brand-400 border border-brand-800/50",
        success: "bg-success-900/40 text-success-400 border border-success-800/50",
        warning: "bg-warning-900/40 text-warning-400 border border-warning-800/50",
        danger: "bg-danger-900/40 text-danger-400 border border-danger-800/50",
        info: "bg-info-900/40 text-info-400 border border-info-800/50",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            variant === "success" && "bg-success-500",
            variant === "warning" && "bg-warning-500",
            variant === "danger" && "bg-danger-500",
            variant === "brand" && "bg-brand-500",
            variant === "info" && "bg-info-500",
            (!variant || variant === "neutral") && "bg-foreground/40"
          )}
        />
      )}
      {children}
    </span>
  );
}
