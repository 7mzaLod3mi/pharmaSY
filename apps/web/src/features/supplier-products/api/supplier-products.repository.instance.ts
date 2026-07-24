import type { SupplierProductsRepository } from "./supplier-products.repository";
import { supplierProductsHttpRepository } from "./supplier-products.http-repository";

/** Single wiring point for the live supplier-products API adapter. */
export const supplierProductsRepository: SupplierProductsRepository = supplierProductsHttpRepository;
