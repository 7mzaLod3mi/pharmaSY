import type { SupplierOrdersRepository } from "./supplier-orders.repository";
import { supplierOrdersHttpRepository } from "./supplier-orders.http-repository";

/** Single wiring point for the live supplier order-fulfillment API adapter. */
export const supplierOrdersRepository: SupplierOrdersRepository = supplierOrdersHttpRepository;
