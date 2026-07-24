import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  /** When provided, the value animates from 0 on scroll-into-view instead of showing static text. */
  animatedValue?: number;
  format?: "number" | "percent" | "currency";
  prefix?: string;
  suffix?: string;
  delta?: { value: string; direction: "up" | "down"; positive?: boolean };
  icon: LucideIcon;
}

export function StatCard({
  label,
  value,
  animatedValue,
  format = "number",
  prefix,
  suffix,
  delta,
  icon: Icon,
}: StatCardProps) {
  const isGood =
    delta?.positive ?? (delta ? delta.direction === "up" : undefined);
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {animatedValue !== undefined ? (
              <AnimatedNumber value={animatedValue} format={format} prefix={prefix} suffix={suffix} />
            ) : (
              value
            )}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-brand-50 border border-brand-200 text-brand-600">
          <Icon className="size-4.5" />
        </div>
      </div>
      {delta && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium",
            isGood ? "text-success-600" : "text-danger-600"
          )}
        >
          {delta.direction === "up" ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          {delta.value}
          <span className="font-normal text-muted-foreground">vs last period</span>
        </div>
      )}
    </Card>
  );
}
