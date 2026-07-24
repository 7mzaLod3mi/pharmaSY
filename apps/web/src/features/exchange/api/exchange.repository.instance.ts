import type { ExchangeRepository } from "./exchange.repository";
import { exchangeMockRepository } from "./exchange.mock-repository";

/**
 * TODO(backend): swap for `exchange.http-repository.ts` once the
 * pharmacy-to-pharmacy exchange endpoints (listings, reservations,
 * moderation) exist. Reservation/oversell conflict handling from the API
 * will need surfacing in `createListing`/a future `purchaseListing` call.
 */
export const exchangeRepository: ExchangeRepository = exchangeMockRepository;
