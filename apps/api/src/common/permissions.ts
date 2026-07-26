import { UserRole } from '@pharmasyn/types';

export const Permissions = {
  ADMIN_MANAGE: 'admin:manage',
  PROFILE_READ: 'profile:read',
  PROFILE_MANAGE: 'profile:manage',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_MANAGE: 'products:manage',
  SUPPLIER_PRODUCTS_MANAGE: 'supplier-products:manage',
  IMPORT_MANAGE: 'import:manage',
  ORDERS_CREATE: 'orders:create',
  ORDERS_READ: 'orders:read',
  ORDERS_MANAGE: 'orders:manage',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_MANAGE: 'inventory:manage',
  POS_SALES_CREATE: 'pos-sales:create',
  POS_SALES_READ: 'pos-sales:read',
  POS_RETURNS_CREATE: 'pos-returns:create',
  POS_SALES_CANCEL: 'pos-sales:cancel',
  NOTIFICATIONS_MANAGE: 'notifications:manage',
  EXCHANGE_MANAGE: 'exchange:manage',
  REPORTS_READ: 'reports:read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  [UserRole.ADMIN]: new Set(Object.values(Permissions)),
  [UserRole.PHARMACY]: new Set([
    Permissions.PROFILE_READ,
    Permissions.PROFILE_MANAGE,
    Permissions.PRODUCTS_READ,
    Permissions.ORDERS_CREATE,
    Permissions.ORDERS_READ,
    Permissions.ORDERS_MANAGE,
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_MANAGE,
    Permissions.POS_SALES_CREATE,
    Permissions.POS_SALES_READ,
    Permissions.POS_RETURNS_CREATE,
    Permissions.POS_SALES_CANCEL,
    Permissions.NOTIFICATIONS_MANAGE,
    Permissions.EXCHANGE_MANAGE,
    Permissions.REPORTS_READ,
  ]),
  [UserRole.SUPPLIER]: new Set([
    Permissions.PROFILE_READ,
    Permissions.PROFILE_MANAGE,
    Permissions.PRODUCTS_READ,
    Permissions.SUPPLIER_PRODUCTS_MANAGE,
    Permissions.IMPORT_MANAGE,
    Permissions.ORDERS_READ,
    Permissions.ORDERS_MANAGE,
    Permissions.NOTIFICATIONS_MANAGE,
    Permissions.REPORTS_READ,
  ]),
};

export function roleHasPermissions(
  role: UserRole,
  requiredPermissions: readonly string[],
): boolean {
  const granted = rolePermissions[role];
  return (
    Boolean(granted) &&
    requiredPermissions.every((permission) =>
      granted.has(permission as Permission),
    )
  );
}
