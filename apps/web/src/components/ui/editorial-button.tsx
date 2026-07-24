import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";

type BaseProps = {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  showArrow?: boolean;
};

type AnchorProps = BaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
  href: string;
};

type ButtonProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
  href?: never;
};

export type EditorialButtonProps = AnchorProps | ButtonProps;

export const EditorialButton = React.forwardRef<HTMLAnchorElement | HTMLButtonElement, EditorialButtonProps>(
  ({ href, variant = "primary", className, children, showArrow = true, ...props }, ref) => {
    const { locale } = useLocale();
    const isPrimary = variant === "primary";
    const isAr = locale === "ar";
    
    const sharedClasses = cn(
      "group relative flex h-[72px] w-[280px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm border px-8 text-[11px] font-bold uppercase transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed",
      isAr ? "" : "tracking-[0.15em]",
      isPrimary 
        ? "border-brand-600 bg-brand-600 text-white" 
        : "border-[#3a3a3a] bg-transparent text-white",
      className
    );

    const innerContent = (
      <>
        {/* Hover Fill Layer */}
        <span 
          className={cn(
            "absolute inset-0 z-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] group-hover:scale-y-100 group-focus-visible:scale-y-100",
            isPrimary ? "bg-brand-800" : "bg-brand-600"
          )}
        />
        
        {/* Content Layer */}
        <span className="relative z-10 flex items-center gap-3">
          {children}
          {showArrow && (
            <ArrowRight className={cn("size-4 transition-transform group-hover:translate-x-1", isAr ? "rotate-180 group-hover:-translate-x-1" : "")} />
          )}
        </span>
      </>
    );

    if (href) {
      return (
        <Link href={href} ref={ref as React.ForwardedRef<HTMLAnchorElement>} className={sharedClasses} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {innerContent}
        </Link>
      );
    }

    return (
      <button ref={ref as React.ForwardedRef<HTMLButtonElement>} className={sharedClasses} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {innerContent}
      </button>
    );
  }
);
EditorialButton.displayName = "EditorialButton";
