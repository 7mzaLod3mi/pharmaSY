import { UserRole } from '@pharmasyn/types';
import { Permissions, roleHasPermissions } from './permissions';

describe('role permission matrix', () => {
  it('does not grant administrative access to pharmacy or supplier users', () => {
    expect(
      roleHasPermissions(UserRole.PHARMACY, [Permissions.ADMIN_MANAGE]),
    ).toBe(false);
    expect(
      roleHasPermissions(UserRole.SUPPLIER, [Permissions.ADMIN_MANAGE]),
    ).toBe(false);
  });

  it('keeps inventory management pharmacy-only', () => {
    expect(
      roleHasPermissions(UserRole.PHARMACY, [Permissions.INVENTORY_MANAGE]),
    ).toBe(true);
    expect(
      roleHasPermissions(UserRole.SUPPLIER, [Permissions.INVENTORY_MANAGE]),
    ).toBe(false);
  });

  it('requires every requested permission', () => {
    expect(
      roleHasPermissions(UserRole.SUPPLIER, [
        Permissions.ORDERS_READ,
        Permissions.INVENTORY_READ,
      ]),
    ).toBe(false);
  });

  it('keeps patient POS sales and returns pharmacy-only', () => {
    expect(
      roleHasPermissions(UserRole.PHARMACY, [
        Permissions.POS_SALES_CREATE,
        Permissions.POS_RETURNS_CREATE,
      ]),
    ).toBe(true);
    expect(
      roleHasPermissions(UserRole.SUPPLIER, [Permissions.POS_SALES_READ]),
    ).toBe(false);
  });
});
