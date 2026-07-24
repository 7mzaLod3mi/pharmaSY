import { BadRequestException } from '@nestjs/common';
import {
  DiscountType,
  Prisma,
  SalePaymentMethod,
} from '@prisma/client';
import { PosService } from './pos.service';

interface PosServiceInternals {
  prepareSalePayments(
    payments: Array<{
      method: SalePaymentMethod;
      amount: number;
      reference?: string;
    }>,
    total: Prisma.Decimal,
  ): {
    paidAmount: Prisma.Decimal;
    tenderedAmount: Prisma.Decimal;
    changeAmount: Prisma.Decimal;
  };
  prepareRefundPayments(
    payments: Array<{
      method: SalePaymentMethod;
      amount: number;
      reference?: string;
    }>,
    expected: Prisma.Decimal,
  ): unknown;
  calculateSaleDiscount(
    discount: { type: DiscountType; value: number },
    eligible: Prisma.Decimal,
  ): Prisma.Decimal;
  hashMutation(value: unknown): string;
}

describe('PosService business calculations', () => {
  const service = new PosService({} as never, {} as never);
  const internals = service as unknown as PosServiceInternals;

  it('applies cash only up to the total and records change separately', () => {
    const result = internals.prepareSalePayments(
      [{ method: SalePaymentMethod.CASH, amount: 110 }],
      new Prisma.Decimal(100),
    );

    expect(result.paidAmount.toString()).toBe('100');
    expect(result.tenderedAmount.toString()).toBe('110');
    expect(result.changeAmount.toString()).toBe('10');
  });

  it('rejects non-cash overpayment and missing card references', () => {
    expect(() =>
      internals.prepareSalePayments(
        [{ method: SalePaymentMethod.CARD, amount: 101, reference: 'AUTH-1' }],
        new Prisma.Decimal(100),
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      internals.prepareSalePayments(
        [{ method: SalePaymentMethod.CARD, amount: 100 }],
        new Prisma.Decimal(100),
      ),
    ).toThrow(BadRequestException);
  });

  it('requires refund payments to match the server-computed refundable amount', () => {
    expect(() =>
      internals.prepareRefundPayments(
        [{ method: SalePaymentMethod.CASH, amount: 49.99 }],
        new Prisma.Decimal(50),
      ),
    ).toThrow('Refund payments must equal 50.00');
  });

  it('rejects percentage discounts above 100 percent', () => {
    expect(() =>
      internals.calculateSaleDiscount(
        { type: DiscountType.PERCENTAGE, value: 100.01 },
        new Prisma.Decimal(100),
      ),
    ).toThrow(BadRequestException);
  });

  it('produces a stable mutation hash regardless of object key order', () => {
    expect(internals.hashMutation({ a: 1, b: { c: 2, d: 3 } })).toBe(
      internals.hashMutation({ b: { d: 3, c: 2 }, a: 1 }),
    );
  });
});
