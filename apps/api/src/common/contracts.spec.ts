import {
  ImportStatus as PrismaImportStatus,
  MovementType as PrismaMovementType,
  NotificationType as PrismaNotificationType,
  OrderStatus as PrismaOrderStatus,
  OrgStatus as PrismaOrgStatus,
  PaymentStatus as PrismaPaymentStatus,
  SaleStatus as PrismaSaleStatus,
  SalePaymentStatus as PrismaSalePaymentStatus,
  SalePaymentMethod as PrismaSalePaymentMethod,
  SalePaymentType as PrismaSalePaymentType,
  SaleReturnType as PrismaSaleReturnType,
  DiscountType as PrismaDiscountType,
  ProductStatus as PrismaProductStatus,
  RequestStatus as PrismaRequestStatus,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
} from '@prisma/client';
import {
  ImportStatus,
  MovementType,
  NotificationType,
  OrderStatus,
  OrgStatus,
  PaymentStatus,
  SaleStatus,
  SalePaymentStatus,
  SalePaymentMethod,
  SalePaymentType,
  SaleReturnType,
  DiscountType,
  ProductStatus,
  RequestStatus,
  UserRole,
  UserStatus,
} from '@pharmasyn/types';

const enumPairs = [
  ['UserRole', PrismaUserRole, UserRole],
  ['UserStatus', PrismaUserStatus, UserStatus],
  ['OrgStatus', PrismaOrgStatus, OrgStatus],
  ['OrderStatus', PrismaOrderStatus, OrderStatus],
  ['PaymentStatus', PrismaPaymentStatus, PaymentStatus],
  ['SaleStatus', PrismaSaleStatus, SaleStatus],
  ['SalePaymentStatus', PrismaSalePaymentStatus, SalePaymentStatus],
  ['SalePaymentMethod', PrismaSalePaymentMethod, SalePaymentMethod],
  ['SalePaymentType', PrismaSalePaymentType, SalePaymentType],
  ['SaleReturnType', PrismaSaleReturnType, SaleReturnType],
  ['DiscountType', PrismaDiscountType, DiscountType],
  ['MovementType', PrismaMovementType, MovementType],
  ['NotificationType', PrismaNotificationType, NotificationType],
  ['ImportStatus', PrismaImportStatus, ImportStatus],
  ['ProductStatus', PrismaProductStatus, ProductStatus],
  ['RequestStatus', PrismaRequestStatus, RequestStatus],
] as const;

describe.each(enumPairs)(
  '%s shared contract',
  (_name, prismaEnum, sharedEnum) => {
    it('matches the generated database enum exactly', () => {
      expect(Object.values(sharedEnum).sort()).toEqual(
        Object.values(prismaEnum).sort(),
      );
    });
  },
);
