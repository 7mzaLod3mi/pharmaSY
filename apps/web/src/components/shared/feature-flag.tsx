import type { ReactNode } from "react";
import { isFeatureEnabled, type FeatureFlagKey } from "@/lib/feature-flags";

export function FeatureFlag({
  flag,
  fallback = null,
  children,
}: {
  flag: FeatureFlagKey;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return isFeatureEnabled(flag) ? <>{children}</> : <>{fallback}</>;
}
