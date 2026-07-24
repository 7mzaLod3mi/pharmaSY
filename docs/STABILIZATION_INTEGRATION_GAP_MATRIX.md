# PharmaSY stabilization and integration matrix

Audit date: 2026-07-24  
Source of truth: the current `apps/api`, `apps/web`, Prisma schema, guards, DTOs, and workspace scripts. Older plans were used only as background.

## Status key

- **Connected**: the visible workflow uses a real API and its main mutation path is present.
- **Partial**: real APIs are used, but a required workflow or state is still incomplete.
- **Blocked**: the backend contract does not safely support the promised workflow.
- **Planned**: no production implementation exists and it must not be presented as live.

| Area | Backend evidence | Frontend evidence | Actual status | Required stabilization |
|---|---|---|---|---|
| Two-stage account verification | `auth`, `pharmacies`, `suppliers`, `admin`; account and organization status checks | public auth pages and `auth-provider.tsx` | Connected | Production still requires valid Resend credentials and a public frontend URL. |
| Organization onboarding and approval | pharmacy/supplier registration; admin approval/rejection routes | onboarding, approvals, organizations | Connected | Keep rejection reason mandatory and expose each account state distinctly. |
| Master product catalog | `products`, `categories`, `manufacturers`, `product-requests` | admin products, categories, manufacturers and product requests | Connected | Admin owns catalog mutations; unmatched pharmacy imports create product requests instead of products. |
| Marketplace | protected marketplace catalog and product-offer comparison | marketplace search, product details, offer comparison and cart | Connected | Category/search filters now map to bounded organization-protected endpoints. |
| Cart and checkout | transactional `/orders/checkout` with server-side prices and organization isolation | pharmacy cart | Connected | Preserve supplier grouping and display backend conflicts; never trust a client-provided price. |
| Orders | pharmacy/supplier lists, detail and allowed state transitions | list and detail pages for both roles | Connected | Replace remaining hardcoded dashboard summaries with API data and keep status actions permission-aware. |
| Inventory | batches, movements, alerts, FEFO, adjustment, idempotent import commit | inventory, movements, alerts, setup/import | Connected | Batch selling price is persisted for POS; unmatched imports are excluded and submitted for Admin catalog review. |
| Pharmacy POS | sales, payments, discounts, FEFO deduction, partial/full returns, cancellations, idempotency | POS, history and receipt pages | Connected | Client sends stable device/mutation metadata; prices and stock remain server-authoritative. |
| Reports and exports | report catalog/data, Excel/PDF, async jobs, retry and signed download | shared pharmacy/supplier report center | Connected | Direct and queued exports use the actual XLSX/PDF and AR/EN contracts. |
| Supplier offers | supplier-product CRUD, batches, tiered discounts and availability | supplier product list and complete create/edit dialog | Connected | Offers must link to an existing Admin catalog product. |
| Supplier imports | R2 upload, BullMQ processing, import history/detail | supplier Excel import | Connected | XLSX is supported; CSV is intentionally limited to pharmacy inventory setup. |
| Notifications | list/count/preferences/read/delete and Socket.IO delivery | shared notification center and settings | Connected | Verify reconnect deduplication and expired-session handling; all role links should use the shared route. |
| User administration | admin stats/users/suspend/activate | admin users | Connected | Dashboard metrics must come from `/admin/stats`; actions must surface forbidden/conflict responses. |
| Audit | organization-aware audit query including actor identity | admin audit page | Connected | Read-only, paginated, real actor and reason fields. |
| Profile/settings | notification preferences and pharmacy/supplier profile PATCH endpoints | shared profile/settings pages | Connected | Personal identity remains intentionally read-only; organization contact data persists through role-scoped endpoints. |
| Pharmacy exchange | create/delete offers only | exchange page and mock repository | Blocked | Disable production navigation and mock data until browse, purchase, fulfillment, isolation and stock contracts exist. |
| Favorites/customers/admin reports | no complete role-specific backend contract | navigation links only | Blocked | Remove broken navigation until real contracts and pages exist. |
| Offline synchronization | POS mutation metadata and server-authoritative FEFO stock are prepared | no offline engine | Planned | Keep UUID mutation IDs, stable per-device IDs, conflict responses and server-authoritative stock; do not advertise offline operation yet. |
| AI and finance | schema/planning only | no production pages | Planned | Keep feature flags off. |

## Immediate gate findings

1. The first frontend type-check failed because three newly referenced UI components did not exist and one badge variant was invalid.
2. The inventory import mapping UI bypassed the project component set; it is being replaced with existing accessible primitives.
3. POS displayed a hardcoded `$15.00` when inventory had no price. It now refuses unpriced stock and the server verifies the FEFO batch price.
4. Exchange was explicitly wired to `exchangeMockRepository`. Its production flag and navigation are now disabled.
5. Operational repositories and the corrected pages now use typed live contracts; remaining legacy direct calls are recorded in the final report.
6. Navigation links without a real page or safe backend workflow were removed.
7. The active working tree already contained an unrelated modification to `apps/web/src/stores/loader-store.ts`; this pass leaves that user change untouched.

## Verification boundary

This pass uses only the requested lightweight checks: Prisma validation if Prisma changes, TypeScript checks, frontend lint, API/frontend production builds, and the root build. It does not run destructive database tests, broad E2E suites, browser automation, or concurrency testing.
