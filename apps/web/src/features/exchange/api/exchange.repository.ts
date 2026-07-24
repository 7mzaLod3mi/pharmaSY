import type { CreateExchangeListingInput, ExchangeFilters, ExchangeListing } from "./exchange.types";

export interface ExchangeRepository {
  listListings(filters?: ExchangeFilters): Promise<ExchangeListing[]>;
  getListing(id: string): Promise<ExchangeListing | undefined>;
  createListing(input: CreateExchangeListingInput): Promise<ExchangeListing>;
}
