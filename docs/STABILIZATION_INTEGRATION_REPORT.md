# PharmaSY stabilization and integration report

Date: 2026-07-24

## Outcome

The active applications are `apps/web` and `apps/api`. The operational pharmacy, supplier, and Admin navigation now points only to implemented routes. Frontend and backend TypeScript checks, frontend lint, Prisma validation, and both production builds pass.

This pass did not run database-backed, E2E, browser, or concurrency suites, following the requested lightweight-verification boundary.

## Errors fixed

- Removed invalid UI imports and badge variants that initially broke the frontend type-check.
- Corrected report contract drift (`XLSX`/`PDF`, `reportType`, bilingual titles, async export state).
- Removed the fabricated POS fallback price. The server derives and validates the first sellable FEFO price.
- Added the missing inventory batch selling-price write path required by POS.
- Replaced fixed mutation/device identifiers with stable device IDs and UUID mutation IDs.
- Corrected pharmacy and supplier order detail fields to the actual nested API response.
- Corrected low-stock, expiry, movement, import, audit, supplier-product, and product-request response shapes.
- Removed false success notifications that ran before mutations succeeded.
- Added normalized backend error handling to critical mutations.
- Fixed Admin audit results so they include the real acting user.
- Removed broken navigation entries and disabled the incomplete exchange workflow.

## Integration gaps closed

### Pharmacy

- Marketplace search is protected, permission checked, bounded, and organization appropriate.
- Product detail compares real supplier offers and can add a chosen offer to cart.
- Checkout uses a retry-stable idempotency key and device identity.
- Pharmacy order details and allowed cancellation use the real contract.
- Inventory batches support purchase cost, POS selling price, stock threshold, adjustment, deletion, movement history, low-stock alerts, and expiry alerts.
- Spreadsheet setup validates rows, sanitizes formula-like cells, matches only existing catalog products, and creates Product Requests for unmatched medicines.
- Inventory import commit is transactionally idempotent and rejects mutation-ID reuse with different content.
- POS uses server-authoritative FEFO stock/prices, line and sale discounts, multiple payments, tender/change, staff identity, sale history, partial/full returns, cancellation, and audit/idempotency metadata.
- Reports support direct and queued Excel/PDF exports, Arabic/English output, status polling, retry, history, and private signed downloads.

### Supplier

- Dashboard metrics are derived from real offers and orders.
- Supplier offers link only to the master catalog and support real stock, batch, expiry, price, availability, notes, and quantity tiers.
- Import upload/history/detail use actual backend fields and BullMQ status values.
- Order detail and status changes use real fields and surface backend failures.
- Supplier report route uses the shared full report center.

### Administration

- Dashboard uses `/admin/stats`.
- Category and manufacturer administration pages are reachable.
- Product create/edit uses real categories, manufacturers, and valid product statuses.
- Product Requests support validated approve, merge, and reject flows. Approval requires the Admin to choose canonical catalog data.
- Organization rejection reasons are mandatory and approval cannot precede email verification.
- User suspension/activation and audit logs are connected and error aware.

### Settings and notifications

- Pharmacy and supplier organization contact settings persist through role-protected PATCH routes with audit logging.
- Notification preference keys and channel/digest values now match the backend.
- Real-time notification handling retains reconnect recovery and event de-duplication.

## Backend endpoints changed or added

- `GET /v1/marketplace/products/:productId` — compare active supplier offers for a master product.
- `GET /v1/marketplace/products` — now authenticated, pharmacy/permission protected, filtered and bounded.
- `PATCH /v1/pharmacies/profile` — update the authenticated pharmacy organization.
- `PATCH /v1/suppliers/profile` — update the authenticated supplier organization.
- Product Request approval now requires canonical category, Arabic/English names and unit; merge requires a real target product.
- Pharmacy cancellation of its own supplier order is allowed only in supported pre-fulfillment states.
- Inventory batch creation now accepts and stores `sellingPrice`.
- Inventory import commit now enforces a pharmacy-scoped idempotency record and request hash.

## Migration

- `apps/api/prisma/migrations/20260724150000_inventory_import_idempotency/migration.sql`
- Adds `inventory_import_mutations` with a unique `(pharmacyId, clientMutationId)` constraint and supporting indexes.
- The migration was created and schema-validated but was not deployed to any real database.

## Remaining limitations

| Feature | Status | Exact reason / next work |
|---|---|---|
| Pharmacy exchange | Blocked/hidden | Backend only supports an incomplete listing subset; purchase, fulfillment and safe stock lifecycle contracts are absent. |
| Offline sync | Planned | Mutation metadata is prepared, but no queue/conflict/reconciliation engine or offline UI exists. |
| AI and finance | Planned | Schema/planning only; no production service or user workflow. |
| Organization documents | Partial | Current organization records do not expose persisted document URLs to the Admin review UI. |
| Full bilingual coverage | Partial | Navigation/auth/report center are bilingual and direction-aware, but several operational page labels remain hardcoded English. A complete copy extraction pass is still required for identical AR/EN coverage. |
| Destructive-action dialogs | Partial | Several mature flows use dialogs, but a few legacy actions still use browser confirm/prompt. |
| Legacy direct API calls | Partial | Critical corrected flows are typed; some older read-only pages still call the centralized Axios instance directly instead of a repository abstraction. |
| Responsive/browser verification | Not executed | Production build succeeds, but manual browser/device QA was excluded by the requested verification boundary. |
| Runtime email/export infrastructure | Environment-dependent | Resend, Redis/BullMQ, R2 and public application URLs require valid deployment credentials and running services. |

## Verification

| Check | Result |
|---|---|
| Frontend TypeScript | Passed |
| Backend TypeScript | Passed |
| Frontend ESLint | Passed with no warnings |
| Prisma schema validation | Passed |
| Next.js production build | Passed; 52 pages generated |
| NestJS production build | Passed |
| Database/E2E/browser tests | Not run by explicit task constraint |

## Final feature matrix

### Fully working at contract/build level

- Authentication and two-stage account-state handling
- Admin organization approval/rejection
- Master catalog administration and Product Requests
- Supplier offers and XLSX import status
- Marketplace, offer comparison, cart and checkout
- Pharmacy/supplier order lists, details, fulfillment and allowed cancellation
- Inventory batches, adjustments, movements and alerts
- Pharmacy POS sales, multiple payments, discounts, FEFO, returns and cancellation
- Pharmacy/supplier reports and private exports
- Notifications and preferences
- Organization settings
- Admin users and audit logs

### Partially working

- Complete Arabic translation coverage
- Organization approval document review
- Uniform custom dialogs for every destructive action
- Repository abstraction on all older read-only pages

### Blocked or intentionally hidden

- Pharmacy exchange end-to-end commerce

### Missing/planned

- Offline Sync Engine
- AI recommendations
- Finance implementation
