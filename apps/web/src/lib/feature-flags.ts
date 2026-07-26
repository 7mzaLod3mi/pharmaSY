/**
 * Centralized feature flags.
 *
 * Each flag controls visibility/behavior of a module that may not have a
 * live backend yet. A flag being `true` means "show this in navigation and
 * render its (possibly mock-backed) pages" — it does NOT imply the backend
 * is implemented; check the feature's integration status for that (see
 * `FeatureIntegrationStatus` below).
 *
 * In a real deployment this object would be hydrated from a remote config
 * service / admin settings page instead of hardcoded — the shape is what
 * matters for now.
 */
export const featureFlags = {
  offlineSync: false,
  advancedReports: false,
  exchangeMarketplace: false,
  aiAssistant: false,
  aiRecommendations: false,
  demandForecasting: false,
  financeModule: false,
  electronicPayments: false,
  creditManagement: false,
  multiCountry: false,
  multiCurrency: false,
  multiBranch: false,
  integrations: false,
  developerPortal: false,
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return featureFlags[key];
}

/**
 * How "real" a feature's backend integration is. Every feature module
 * should declare one of these so pages can show an honest "Future feature"
 * or "Preview" badge instead of silently pretending to be live.
 */
export type FeatureIntegrationStatus =
  | "implemented"
  | "backend-ready"
  | "mock-backed"
  | "future"
  | "feature-flagged";

export const featureIntegrationStatus: Record<string, FeatureIntegrationStatus> = {
  auth: "implemented",
  organizations: "implemented",
  marketplace: "implemented",
  orders: "implemented",
  inventory: "implemented",
  exchange: "feature-flagged",
  notifications: "implemented",
  supplierProducts: "implemented",
  adminApprovals: "implemented",
  adminOrganizations: "implemented",
  pos: "implemented",
  reports: "implemented",
  ai: "future",
  finance: "future",
  offlineSync: "future",
  integrations: "future",
};
