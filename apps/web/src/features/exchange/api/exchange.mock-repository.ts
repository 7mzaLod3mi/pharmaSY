import type { ExchangeRepository } from "./exchange.repository";
import type { ExchangeFilters, ExchangeListing } from "./exchange.types";

let listings: ExchangeListing[] = [
  {
    id: "ex_1",
    productName: "Vitamin D3 5000IU (60 units, unopened box)",
    batchNumber: "VD-2405",
    expiryDate: "2026-12-01",
    city: "Amman",
    sellerPharmacyName: "Al-Shifa Branch 2",
    availableQuantity: 60,
    reservedQuantity: 0,
    price: 45.0,
    status: "active",
    createdAt: "2026-07-10T10:00:00Z",
  },
  {
    id: "ex_2",
    productName: "Omeprazole 20mg (slow-moving, 200 units)",
    batchNumber: "OM-2403",
    expiryDate: "2026-10-15",
    city: "Irbid",
    sellerPharmacyName: "Care Point Pharmacy",
    availableQuantity: 200,
    reservedQuantity: 40,
    price: 1.1,
    status: "active",
    createdAt: "2026-07-14T08:30:00Z",
  },
  {
    id: "ex_3",
    productName: "Insulin Glargine Pen (near expiry, 8 units)",
    batchNumber: "IG-2407",
    expiryDate: "2026-08-20",
    city: "Amman",
    sellerPharmacyName: "MediWell Pharmacy",
    availableQuantity: 8,
    reservedQuantity: 0,
    price: 22.0,
    status: "pending_review",
    createdAt: "2026-07-20T16:45:00Z",
    mine: true,
  },
];

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const exchangeMockRepository: ExchangeRepository = {
  async listListings(filters?: ExchangeFilters): Promise<ExchangeListing[]> {
    let items = listings;
    if (filters?.mineOnly) items = items.filter((l) => l.mine);
    if (filters?.city) items = items.filter((l) => l.city === filters.city);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((l) => l.productName.toLowerCase().includes(q));
    }
    return delay(items);
  },
  async getListing(id: string): Promise<ExchangeListing | undefined> {
    return delay(listings.find((l) => l.id === id));
  },
  async createListing(input): Promise<ExchangeListing> {
    const created: ExchangeListing = {
      id: `ex_${Math.random().toString(36).slice(2, 8)}`,
      productName: input.productName,
      batchNumber: input.batchNumber,
      expiryDate: input.expiryDate,
      city: input.city,
      sellerPharmacyName: "Your pharmacy",
      availableQuantity: input.quantity,
      reservedQuantity: 0,
      price: input.price,
      status: "pending_review",
      createdAt: new Date().toISOString(),
      mine: true,
    };
    listings = [created, ...listings];
    return delay(created);
  },
};
