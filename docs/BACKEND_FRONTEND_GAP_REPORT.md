# PharmaSY Backend-to-Frontend Gap Report

**Audit date:** 2026-07-24  
**Official frontend:** `apps/web` (`@pharmasyn/web`)  
**API prefix:** `/api/v1`

This report is based on the controllers, services, DTOs, Prisma schema, migrations, tests, and the frontend repositories/hooks actually present in the repository. A page is marked connected only when it calls the real API through the centralized client.

## Status legend

- **Connected:** the current page uses the real API for its primary workflow.
- **Partial:** a useful subset is connected, but important actions or pages are absent.
- **Mocked:** visible data/actions still come from an in-memory mock because no matching complete backend workflow exists.
- **Missing:** backend exists, but the new frontend has no usable page.
- **Backend-ready:** API is complete and tested; frontend work remains.
- **Planned:** schema, flag, or placeholder only; no complete service workflow.

## Authentication and security

| Capability | Backend evidence and API | Frontend evidence | Status | Remaining work / priority |
|---|---|---|---|---|
| Register and login | `auth/auth.controller.ts`: `POST auth/register`, `POST auth/login` | `features/auth`, `/register`, `/login` | Connected | Add localized validation copy. P1 |
| Email verification | `POST auth/verify-email`, `POST auth/resend-verification` | `/verify-email` | Connected | Improve resend cooldown UX. P2 |
| Password recovery | `POST auth/forgot-password`, `POST auth/reset-password` | `/forgot-password`, `/reset-password` | Connected | Add password strength meter. P2 |
| Session refresh/logout | HttpOnly refresh cookie, origin check, refresh rotation; `POST auth/refresh`, `POST auth/logout` | `lib/http-client.ts`, `AuthProvider`, topbar logout | Connected | Access tokens are memory-only; concurrent refresh is single-flight. |
| Current user/account status | `GET users/me`; pending-organization guard | `AuthProvider`, `DashboardShell` | Connected | Dedicated suspended/rejected support pages would improve UX. P2 |
| Roles and permissions | Backend roles and permission guard in `common/permissions.ts` | `lib/permissions.ts`, role-aware dashboard guard | Connected | Backend remains authoritative. |

## Organizations

| Capability | Backend evidence and API | Frontend evidence | Status | Remaining work / priority |
|---|---|---|---|---|
| Pharmacy/supplier profile creation | `POST pharmacies/profile`, `POST suppliers/profile` | `/onboarding`, `features/organizations` | Connected | Document attachment is not part of these DTOs. P1 if legally required. |
| Profile view | `GET pharmacies/profile`, `GET suppliers/profile` | No profile/settings page | Missing | Build role-specific profile page. P1 |
| Approval queue | `GET admin/pending/pharmacies`, `GET admin/pending/suppliers`; approve/reject routes | `/admin/approvals` | Connected | UI should require a typed rejection reason instead of the safe default. P1 |
| Organization administration | `GET admin/users`, suspend/activate user | `/admin/organizations` maps owner accounts to organizations | Partial | Backend controls the owner account, not a distinct organization suspension route or multi-user count. P1 |

## Catalog

| Capability | Backend evidence and API | Frontend status | What works now | Missing |
|---|---|---|---|---|
| Categories | `categories` CRUD; public tree | Partial | Real category filter in marketplace | Admin CRUD pages absent. |
| Manufacturers | `manufacturers` CRUD | Missing | None | Public/admin list and CRUD UI. |
| Global products | product search, barcode lookup, details, admin CRUD | Partial | Marketplace offers show real product data | Catalog pages, barcode UI, detail page and admin CRUD absent. |
| Product requests | create/list/similar/admin approve/reject/merge | Missing | None | Supplier/pharmacy request flow and admin review. |

## Supplier products and imports

| Capability | Backend evidence and API | Frontend status | What works now | Missing |
|---|---|---|---|---|
| Supplier offers | `GET/POST/PATCH/DELETE supplier-products` | Partial | Real list, search, availability toggle | Add/edit/delete dialogs are not wired. |
| Excel import | `POST import/excel`, `GET import/history`, `GET import/:id`; BullMQ processor | Backend-ready / missing | Button is visual only | Upload, preview/report, progress/history and failure details. P1 |

## Marketplace, cart, and orders

| Capability | Backend evidence and API | Frontend status | What works now | Missing |
|---|---|---|---|---|
| Marketplace offers | `GET marketplace/products` combines supplier and pharmacy offers | Connected | Search, categories, supplier name, stock state, add to local cart | Product detail and price comparison screen. |
| Cart | Client state; checkout contract supports supplier and pharmacy offers | Partial | Supplier grouping, MOQ and maximum-stock bounds are preserved | `/pharmacy/cart` page is absent. |
| Checkout | `POST orders/checkout`, server prices, stock transaction, `clientMutationId`, `deviceId` | Backend-ready / missing | Cart records the correct offer identifier | Checkout page, stable mutation UUID/device ID, retry/conflict UI. P0 |
| Pharmacy orders | `GET orders/pharmacy`, `GET orders/:id` | Partial | Real list, filters and search | Details, pagination, cancellation action and export button wiring. |
| Supplier fulfillment | `GET orders/supplier`, validated `PATCH orders/:id/status` | Partial | Real list and PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED transitions | Details, cancellation UX, mutation error feedback and pagination. |

## Inventory

| Capability | Backend evidence and API | Frontend status | What works now | Missing |
|---|---|---|---|---|
| Batches and metrics | `GET inventory`, `GET inventory/dashboard` | Connected | Real batch grouping, quantities, reserved/available stock and metrics | Pagination/search controls use a 100-row adapter cap. P1 |
| Movements | `GET inventory/:id/movements` | Partial | Repository supports product movement aggregation | No movement-history route/page. |
| Create/adjust/delete | `POST inventory`, `PATCH inventory/:id/adjust`, `DELETE inventory/:id` | Missing | None | Batch CRUD dialogs and audit-reason UI. |
| Low stock/expiry | alert routes | Partial | Counts appear in inventory overview | Dedicated low-stock and expiry pages absent. |
| FEFO | Server allocation in `inventory.service.ts` and POS/order workflows | Backend-only | Stock remains server-authoritative | POS/order detail should display allocations where useful. |

## Exchange

Backend currently exposes only `POST exchange/offers` and `DELETE exchange/offers/:id`. The new frontend displays a richer browse/create exchange experience backed by `exchange.mock-repository.ts`.

**Status: Mocked.** Listing search, purchasing/reservation, exchange orders, moderation, tracking and oversell handling do not have matching complete APIs. The mock is intentionally retained and must be labeled as a preview before production. P0 if exchange is to launch.

## Notifications

| Capability | Backend evidence and API | Frontend status | Remaining |
|---|---|---|---|
| List/count/read | notifications controller and service | Connected | Add delete UI and pagination. |
| Preferences | `GET/PATCH notifications/preferences` | Missing | Settings UI. |
| Real time | Socket.io `notification:new` and `notification:updated` | Connected | Client reconnects, refreshes token metadata, and suppresses duplicate IDs. |
| Email | email queue and user preferences | Backend-ready | No preference UI or delivery-history view. |

## Audit

`GET audit` is implemented with organization isolation and admin access rules. There is no `/admin/audit-logs` page despite the navigation entry.

**Status: Backend-ready / missing. Priority P1.**

## POS

Backend APIs:

- `POST pos/sales`
- `GET pos/sales`
- `GET pos/sales/:saleId`
- `POST pos/sales/:saleId/returns`
- `POST pos/sales/:saleId/cancel`

The backend supports items, sale/item discounts, multiple payments, staff attribution, FEFO allocation, movements, returns, cancellation, audit records, `deviceId`, `clientMutationId`, retry-safe mutations and server-authoritative stock.

**Frontend status: Missing.** There is no POS route or interface in the imported frontend. Patients do not place website orders; this future interface is for pharmacy staff recording physical in-store sales. Required UI includes barcode/product search, cart, payment/change, receipt, history, partial/full returns, cancellation and conflict states. P0.

## Reports and exports

Backend report catalog:

- Pharmacy POS sales and returns
- Supplier sales
- C2C exchange
- Orders and fulfillment
- Inventory value and movements
- Low stock and expiry
- Product/category performance

APIs include role-scoped catalog/data, direct Excel or Arabic/English PDF export, async export creation/list/detail/retry, and private signed download links:

- `GET reports/catalog`
- `GET reports/:reportType`
- `GET reports/:reportType/export`
- `POST reports/exports`
- `GET reports/exports`
- `GET reports/exports/:id`
- `GET reports/exports/:id/download`
- `POST reports/exports/:id/retry`

**Frontend status: Backend-ready / missing.** Supplier/admin navigation mentions reports, but no report page exists and no real export is invoked. Admin receives an empty catalog by current backend design. P0.

## Administration

- **Connected:** pending approvals; organization-owner list, suspend and activate.
- **Static/mock presentation:** admin dashboard metric cards.
- **Missing despite backend:** users page, audit log page, catalog CRUD, product-request moderation.
- **Not supported as advertised by navigation:** distinct pharmacy/supplier directory pages and organization-level multi-user management.

## Offline Sync

The old temporary frontend contained a Dexie draft. It was not migrated into active code because no complete sync protocol exists. POS and order mutations already reserve `deviceId` and `clientMutationId`, and stock remains server-authoritative.

**Status: Planned.** Phase 10 needs a versioned mutation envelope, pull cursor, conflict/result model, device registration, replay ordering and reconciliation UX.

## AI and finance

Prisma contains `AIRecommendation`, `CreditLimit` and `Invoice`-related schema. There are no complete feature services/controllers and the imported UI only has future-facing flags/marketing references.

**Status: Planned, not available.** Feature flags are disabled so these are not represented as live modules.

## Highest-priority frontend work

1. Build cart and idempotent checkout.
2. Build the complete pharmacist POS.
3. Build reports, exports, job progress/history/retry and signed-link expiry recovery.
4. Complete supplier product edit/import workflows.
5. Add order detail/actions and inventory batch/movement/alert pages.
6. Replace the exchange preview only after the missing exchange APIs are designed.
7. Add audit, catalog administration, notification preferences and profile/settings pages.
