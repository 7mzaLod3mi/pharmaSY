"use client";

import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductCardProps {
  title: string;
  description: string;
  price: string;
  imageSrc?: string;
  onAdd?: () => void;
  className?: string;
}

export function ProductCard({
  title,
  description,
  price,
  imageSrc,
  onAdd,
  className,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-3.5 shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      <div
        className="h-32 w-full rounded-[var(--radius-md)] bg-brand-50 bg-cover bg-center"
        style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined}
      />
      <div className="pt-3">
        <p className="text-[14.5px] font-semibold leading-snug text-foreground">{title}</p>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-3 flex w-full items-center justify-between border-t border-border pt-3">
        <span className="text-[15.5px] font-semibold text-foreground">{price}</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add to cart"
          className="flex cursor-pointer items-center justify-center rounded-full border border-border-strong p-2 text-foreground/70 transition-colors duration-200 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600"
        >
          <ShoppingCart className="size-4" />
        </button>
      </div>
    </div>
  );
}
