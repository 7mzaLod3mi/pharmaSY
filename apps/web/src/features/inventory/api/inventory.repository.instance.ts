import type { InventoryRepository } from "./inventory.repository";
import { inventoryHttpRepository } from "./inventory.http-repository";

/** Single wiring point for the live inventory API adapter. */
export const inventoryRepository: InventoryRepository = inventoryHttpRepository;
