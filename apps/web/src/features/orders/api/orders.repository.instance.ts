import type { OrdersRepository } from "./orders.repository";
import { ordersHttpRepository } from "./orders.http-repository";

/** Single wiring point for the live pharmacy-orders API adapter. */
export const ordersRepository: OrdersRepository = ordersHttpRepository;
