import type { ReactNode } from "react";
import { can, canAny, type Permission, type Role } from "@/lib/permissions";

interface PermissionGateProps {
  role: Role | undefined | null;
  /** Require a single permission, or provide `anyOf` for an OR check. */
  permission?: Permission;
  anyOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Wrap any button, form, table action, or route section that should only
 * render for users holding a given permission. Prefer this over hiding a
 * nav item alone — protect the action itself, not just the menu entry.
 */
export function PermissionGate({ role, permission, anyOf, fallback = null, children }: PermissionGateProps) {
  const allowed = permission ? can(role, permission) : anyOf ? canAny(role, anyOf) : true;
  return allowed ? <>{children}</> : <>{fallback}</>;
}
