import type { ExchangeRepository } from "./exchange.repository";

/**
 * TODO(backend): swap for `exchange.http-repository.ts` once the
 * pharmacy-to-pharmacy exchange endpoints (listings, reservations,
 * moderation) exist. Reservation/oversell conflict handling from the API
 * will need surfacing in `createListing`/a future `purchaseListing` call.
 */
const unavailableMessage =
  "The exchange workflow is not available until browse, purchase, fulfillment, and stock-transfer APIs are complete.";

export const exchangeRepository: ExchangeRepository = {
  async listListings() {
    return [];
  },
  async getListing() {
    return undefined;
  },
  async createListing() {
    throw new Error(unavailableMessage);
  },
};
