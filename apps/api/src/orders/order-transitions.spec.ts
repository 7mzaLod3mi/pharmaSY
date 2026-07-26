import { OrderStatus } from '@prisma/client';
import { ORDER_TRANSITIONS } from './orders.service';

describe('order lifecycle', () => {
  it('requires fulfillment steps before delivery', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.PENDING]).not.toContain(
      OrderStatus.DELIVERED,
    );
    expect(ORDER_TRANSITIONS[OrderStatus.PENDING]).toContain(
      OrderStatus.CONFIRMED,
    );
    expect(ORDER_TRANSITIONS[OrderStatus.CONFIRMED]).toContain(
      OrderStatus.PROCESSING,
    );
    expect(ORDER_TRANSITIONS[OrderStatus.PROCESSING]).toContain(
      OrderStatus.SHIPPED,
    );
    expect(ORDER_TRANSITIONS[OrderStatus.SHIPPED]).toContain(
      OrderStatus.DELIVERED,
    );
  });

  it('makes delivered and cancelled orders terminal', () => {
    expect(ORDER_TRANSITIONS[OrderStatus.DELIVERED]).toEqual([]);
    expect(ORDER_TRANSITIONS[OrderStatus.CANCELLED]).toEqual([]);
  });
});
