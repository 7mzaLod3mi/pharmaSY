# PharmaSY Frontend Integration and Cleanup Report

**Date:** 2026-07-24

## Result

- **Official production frontend:** `apps/web`
- **Workspace package:** `@pharmasyn/web`
- **Selected source:** the external dark-editorial `pharmasy-frontend`
- **Former temporary frontend:** first moved recoverably to `tmp/legacy-web-backup`; removed only after the selected frontend passed install, type-check, lint and production build.
- **Active frontend count:** one.

## Original locations and decisions

The root workspace includes `apps/*` and `packages/*`. Before migration, `apps/web` was therefore the active frontend; the external `pharmasy-frontend` was not part of pnpm or Turborepo.

The pre-deletion decision table is preserved in `docs/FRONTEND_MIGRATION_MAP.md`.

| Original path | Decision | Final location |
|---|---|---|
| `pharmasy-frontend/src`, `public`, design configs | Selected and moved | `apps/web` |
| old `apps/web` | Replaced after verification | Removed after temporary backup |
| external `package-lock.json` | Removed | Root `pnpm-lock.yaml` is authoritative |
| old nested `pnpm-lock.yaml` | Removed with old app | Root lockfile only |
| old API/socket behavior | Reimplemented securely | `apps/web/src/lib/http-client.ts`, auth and notification features |
| old PWA metadata | Migrated without broken icon references | `apps/web/src/app/manifest.ts` |
| old feature vocabulary | Reviewed | New frontend keeps its own bilingual dictionary/design; operational copy is added with connected pages |
| old Dexie/offline draft | Not activated | Recorded as future Phase 10 work |

## Workspace and package changes

- Renamed the selected package to `@pharmasyn/web`.
- Added workspace dependencies on `@pharmasyn/shared` and `@pharmasyn/types`.
- Added `socket.io-client` and `rimraf`.
- Added `type-check`, `lint` and `clean` scripts expected by the root tasks.
- Removed the standalone npm lockfile and standalone `node_modules`.
- Updated Next configuration for shared-package transpilation, R2/Unsplash images and security headers.
- Kept the imported Tailwind v4/PostCSS pipeline and dark editorial design.
- Added a frontend `.env.example`.
- Root pnpm installation updated the single root lockfile.

## Authentication and API integration

The new centralized client now:

- Uses `${NEXT_PUBLIC_API_URL}/api/v1`.
- Sends cookies with API calls.
- Holds the access token in memory only.
- Never writes a sensitive token to local or session storage.
- Rotates the HttpOnly refresh cookie through the backend.
- Serializes simultaneous refresh attempts into one request.
- Retries an authenticated request once after refresh.
- Normalizes the backend success/error envelopes.
- Clears the session after an unrecoverable 401.

Connected auth pages: login, register, verify/resend email, forgot password, reset password, logout and organization onboarding. Dashboard access checks the real role, account status and organization approval state.

## Backend modules connected to existing pages

- User session/current profile
- Pharmacy and supplier organization profile creation
- Categories and marketplace supplier/pharmacy offers
- Pharmacy order list/search/filter
- Supplier order list and validated fulfillment transitions
- Supplier product list/search/availability
- Inventory batches, grouped products, dashboard metrics, low-stock count and movement repository
- Notification list/unread/read-all/read-one
- Socket.io notification creation/update events with reconnect and duplicate suppression
- Admin pharmacy/supplier approval and rejection
- Admin user list mapped to organization owners, suspend and reactivate

## Preserved design

The homepage, dark editorial theme, matte borders, photography, cards, buttons, pill loader, animations, responsive layouts, pharmacy/supplier/admin shells, Arabic RTL and English LTR behavior all come from the selected frontend. Backend integration was added behind its repository and hook boundaries instead of replacing the visual system.

## Remaining mocks

Only the pharmacy exchange experience still intentionally uses a mock repository. The backend has create/delete offer operations but lacks the complete browse, reserve, buy, moderate and track workflow expected by the page.

The connected feature folders may retain no active mock wiring after cleanup. Static dashboard metric arrays are still presentation placeholders and must be replaced or labeled before launch.

## Missing pages and incomplete actions

- Pharmacy cart and checkout
- Product detail and supplier comparison
- POS sales, payments, receipts, history, returns and cancellations
- Report catalog, report data views, Excel/PDF export and async export jobs
- Supplier Excel import and import history/report
- Inventory batch CRUD, movement page, expiry and low-stock pages
- Order detail and pharmacy cancellation
- Supplier product add/edit/delete
- Audit logs
- Admin users, catalog CRUD and product-request moderation
- Notification preferences
- Organization/profile settings

Navigation currently contains links for several of these future pages; they should be pruned or implemented in the next UI stage.

## Environment variables

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=PharmaSY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Backend requirements remain documented in `apps/api/.env.example`. The frontend origin must exactly match `FRONTEND_URL` for refresh/logout origin protection and Socket.io CORS. Production cross-site deployment also requires the backend cookie policy and HTTPS configuration to match.

## Verification

Completed during migration:

- Root pnpm dependency installation and lockfile update: passed.
- Frontend TypeScript check: passed.
- Frontend ESLint: passed.
- Frontend production build: passed; 30 static routes generated, including the web manifest.
- Imported design baseline build before replacement: passed; 26 routes.
- No external `pharmasy-frontend` active package remains.
- One root lockfile remains after cleanup.

Final repository verification:

- Root `turbo run type-check`: passed for API, web, shared and types.
- Frontend ESLint: passed.
- Root `turbo run build`: passed for API, web, shared and types.
- API unit tests: 12 suites, 52 tests passed.
- Safe E2E: four migrations applied to isolated PostgreSQL; 3 suites, 29 tests passed. Temporary PostgreSQL and Redis containers were removed afterward.
- Prisma schema validation: passed.
- Browser smoke test: homepage rendered in Arabic RTL and English LTR without horizontal overflow; mobile 390px layout rendered without overflow and exposed the mobile menu; login fields rendered; an anonymous pharmacy route redirected to `/login`; no browser console errors were captured.
- Exactly one Next.js frontend package and one root lockfile remain.

## Known issues and recommended next work

1. Build cart/checkout using stable `clientMutationId` and `deviceId`.
2. Build the missing POS frontend.
3. Build reports/export job UI, including signed-link expiry recovery.
4. Complete import, supplier product, order detail and inventory management workflows.
5. Replace or remove static dashboard metrics.
6. Complete the exchange backend before replacing the only remaining active mock.
7. Add targeted frontend tests for auth refresh serialization, repositories, role gates and representative workflows.
8. Persist the selected locale; it currently returns to Arabic after a full reload.
9. Migrate the backend from AWS SDK v2, which emits its end-of-support warning during tests.
