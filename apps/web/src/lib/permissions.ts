/**
 * Centralized role & permission model.
 *
 * This is intentionally framework-agnostic (no React here) so it can be
 * unit tested and reused from server components, route guards, and client
 * components alike.
 */

export type Role = "ADMIN" | "PHARMACY" | "SUPPLIER";

export type Permission =
  | "admin:manage"
  | "profile:read"
  | "profile:manage"
  | "products:read"
  | "products:manage"
  | "supplier-products:manage"
  | "import:manage"
  | "orders:create"
  | "orders:read"
  | "orders:manage"
  | "inventory:read"
  | "inventory:manage"
  | "pos-sales:create"
  | "pos-sales:read"
  | "pos-returns:create"
  | "pos-sales:cancel"
  | "notifications:manage"
  | "exchange:manage"
  | "reports:read";

/**
 * Role → permission grants. Kept as a flat map so `can()` stays a simple,
 * synchronous lookup — swap this for a real permission-matrix fetched from
 * the backend once that endpoint exists (see `admin.users.manage` roadmap
 * page for the eventual editor UI).
 */
const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "admin:manage", "profile:read", "profile:manage", "products:read", "products:manage",
    "supplier-products:manage", "import:manage", "orders:create", "orders:read",
    "orders:manage", "inventory:read", "inventory:manage", "pos-sales:create",
    "pos-sales:read", "pos-returns:create", "pos-sales:cancel", "notifications:manage",
    "exchange:manage", "reports:read",
  ],
  PHARMACY: [
    "profile:read", "profile:manage", "products:read", "orders:create", "orders:read",
    "orders:manage", "inventory:read", "inventory:manage", "pos-sales:create",
    "pos-sales:read", "pos-returns:create", "pos-sales:cancel", "notifications:manage",
    "exchange:manage", "reports:read",
  ],
  SUPPLIER: [
    "profile:read", "profile:manage", "products:read", "supplier-products:manage",
    "import:manage", "orders:read", "orders:manage", "notifications:manage",
    "reports:read",
  ],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAny(role: Role | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function canAll(role: Role | undefined | null, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}
