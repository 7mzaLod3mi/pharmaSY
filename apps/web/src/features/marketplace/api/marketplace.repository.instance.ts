import type { MarketplaceRepository } from "./marketplace.repository";
import { marketplaceHttpRepository } from "./marketplace.http-repository";

/** Single wiring point for the live marketplace API adapter. */
export const marketplaceRepository: MarketplaceRepository = marketplaceHttpRepository;
