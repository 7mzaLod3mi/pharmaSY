# PharmaSY Frontend Migration Map

This map was produced from a fresh code scan before moving or deleting either
frontend. It records the safety decision for every frontend-level concern.

| Current path | Purpose | Decision | Destination | Reason | Risk / mitigation |
|---|---|---|---|---|---|
| `apps/web` | Current pnpm/Turborepo frontend (`@pharmasyn/web`) | Replace after verification | `apps/web` | It is the only frontend included by `apps/*` and is therefore the current active app | Do not delete until the external frontend builds and valuable integrations are reimplemented |
| `pharmasy-frontend` | New dark editorial Next.js frontend | Move/replace | `apps/web` | This is the selected production design and has the broader route/layout system | It currently sits outside pnpm, uses npm, and is mostly mock-backed |
| `pharmasy-frontend/src/app` | New public, pharmacy, supplier and admin routes | Keep/move | `apps/web/src/app` | Preserve completed visual design, RTL/LTR behavior, animations and responsive layouts | Several navigation links have no page; document them as missing rather than fabricating functionality |
| `pharmasy-frontend/src/components` | New design system and layouts | Keep/move | `apps/web/src/components` | Canonical design implementation | Must not be overwritten by legacy components |
| `pharmasy-frontend/public` | Homepage photography and public assets | Keep/move | `apps/web/public` | Unique to the selected design | Preserve licensing/provenance outside code if required |
| `pharmasy-frontend/src/features/*/*.mock-repository.ts` | Mock data for nine feature areas | Replace where backend exists; retain only genuine gaps | Same feature folders | Repository boundaries are useful, but most TODO comments are stale because APIs now exist | A page existing does not imply workflow completeness; real adapters and gap labels are required |
| `pharmasy-frontend/src/lib/api-client.ts` | Central API client skeleton | Merge/replace | `apps/web/src/lib/api-client.ts` | Correct architectural location but missing `/api/v1`, cookies, refresh serialization and real error envelope handling | Access token must remain memory-only; refresh requests must be single-flight |
| `pharmasy-frontend/src/lib/i18n.tsx` | Runtime Arabic/English direction and core strings | Keep/merge | `apps/web/src/lib/i18n.tsx` | Matches the new design and supports RTL/LTR | Merge useful legacy feature vocabulary; locale is currently not persisted |
| `pharmasy-frontend/src/lib/permissions.ts` | Frontend-only fine-grained fictional role matrix | Replace | `apps/web/src/lib/permissions.ts` | Backend currently has only `ADMIN`, `PHARMACY`, `SUPPLIER` roles with server-defined permissions | Keeping fictional roles would expose invalid UI assumptions |
| `pharmasy-frontend/src/stores/cart-store.ts` | Client-only marketplace cart | Merge | `apps/web/src/stores/cart-store.ts` | Good boundary, but missing backend `supplierProductId`, stock cap and checkout mutation metadata | Merge validated grouping and min/max quantity behavior from legacy cart |
| `apps/web/src/lib/axios/index.ts` | Partial real API/refresh integration | Reimplement, do not copy verbatim | `apps/web/src/lib/api-client.ts` | Valuable endpoint knowledge and cookie use | It stores access tokens in `sessionStorage` and lacks refresh single-flight; both must be corrected |
| `apps/web/src/lib/socket/index.ts` | Socket.io connection helper | Migrate/strengthen | `apps/web/src/lib/socket.ts` | Backend notification gateway exists | Add event deduplication and query-cache invalidation; do not expose token persistently |
| `apps/web/src/store/notification.store.ts` | Real notification REST calls | Reimplement through repository/query hooks | `apps/web/src/features/notifications` | Real endpoints exist and new UI is superior | Avoid duplicate Zustand server state |
| `apps/web/src/store/cart.store.ts` | Supplier-grouped cart and quantity bounds | Merge behavior | `apps/web/src/stores/cart-store.ts` | Contains checkout-compatible supplier grouping | Old shared cart shape has drifted; use current backend DTO |
| `apps/web/messages/ar.json`, `apps/web/messages/en.json` | Feature vocabulary | Merge useful terms | `apps/web/src/lib/i18n.tsx` | More complete operational wording than the new inline dictionary | Do not reintroduce `next-intl` solely for these files |
| `apps/web/src/lib/dexie/db.ts` | Offline database draft | Do not activate; preserve only in history/report | None in current frontend | Offline Sync is explicitly out of scope and backend protocol is not implemented | Reintroduce in Phase 10 against final sync contracts |
| `apps/web/src/proxy.ts` | Disabled route middleware with refresh-cookie decoding | Delete with legacy app | None | It returns immediately and decoding an HttpOnly refresh token client-side is the wrong authorization boundary | Use client auth bootstrap and server-enforced permissions; add middleware later only with a safe server session contract |
| `apps/web/src/app/**` | Temporary design and partially connected pages | Replace | New routes under `apps/web/src/app` | New design is explicitly canonical | Preserve API behavior through repositories before removal |
| `apps/web/public/manifest.json` | PWA metadata | Migrate | `apps/web/public/manifest.json` | Useful and independent of old design | Icons referenced by it must exist or be corrected |
| `apps/web/package.json` | Monorepo package identity and scripts | Merge | `apps/web/package.json` | Keep `@pharmasyn/web`, workspace dependencies, `type-check`, and Turborepo compatibility | Align Next/React versions with the selected frontend and remove duplicate lockfile |
| `pharmasy-frontend/package-lock.json` | Standalone npm lockfile | Delete after pnpm integration | Root `pnpm-lock.yaml` only | Two lockfiles caused Next workspace-root warnings | Run pnpm install before deletion and verify lock consistency |
| `apps/web/pnpm-lock.yaml` | Nested legacy pnpm lockfile | Delete | Root `pnpm-lock.yaml` only | The root workspace lock is authoritative | Verify root install/build first |
| Both `next.config.ts` files | Next image/build/security configuration | Merge | `apps/web/next.config.ts` | New app needs Unsplash assets; legacy config has R2 patterns, workspace transpilation and security headers | Preserve all remote image hosts and security headers |
| Both Tailwind/PostCSS/global CSS configs | Styling pipeline | Select new CSS, keep compatible PostCSS | `apps/web` | New design must remain visually canonical | Tailwind v4 and Next version must stay compatible |
| Both TypeScript/ESLint configs | Type and lint rules | Select new strict TS, retain workspace scripts | `apps/web` | New project already builds strictly | Add shared package imports and explicit type-check script |
| `.env` / `.env.example` | Frontend runtime URLs | Normalize | `apps/web/.env.example` | Backend is `http://localhost:3001/api/v1`; socket origin is `http://localhost:3001` | Never commit real secrets; only `NEXT_PUBLIC_API_URL` and app metadata are public |

## Conflicts found

- **Active package:** `@pharmasyn/web` is active; `pharmasy-frontend` is not in
  the pnpm workspace.
- **Package manager:** root uses pnpm; the new frontend uses npm and carries a
  separate lockfile.
- **Framework versions:** legacy uses Next 16/React 19.2; new design uses
  Next 15.5/React 19.1. The selected frontend's tested versions will be used.
- **API base URL:** legacy app correctly appends `/api/v1`; the new app
  currently defaults to `/api` and therefore does not match the backend.
- **Authentication:** legacy app uses `sessionStorage`; the new app uses only an
  in-memory variable but has no auth UI wiring or refresh implementation.
- **Roles:** new frontend models ten roles that do not exist in the backend.
- **Routes:** new navigation advertises many pages that are not implemented,
  including cart, reports, POS, imports, catalog administration and audit.
- **Mocks:** marketplace, orders, inventory, supplier orders/products,
  notifications, approvals, organizations and exchange are mock-backed.
- **Exchange contract:** the frontend models full listings, while the backend
  currently exposes marketplace offers creation/deletion only.
- **Realtime:** backend Socket.io notifications exist; new frontend has no
  socket connection.
- **Ports:** both frontends expect port 3000 and the backend expects 3001;
  there is no need to retain two frontend dev ports.

## Safe deletion gate

`apps/web` may be replaced only after all of the following are true:

1. `pharmasy-frontend` baseline production build succeeds.
2. Its package is integrated under `apps/web` and the root lockfile is updated.
3. Real repository adapters compile for backend-supported pages.
4. Authentication uses an HttpOnly refresh cookie and memory-only access token.
5. Root workspace commands select one frontend package.
6. The integrated frontend production build succeeds.
7. Searches show no remaining active reference to the standalone frontend or
   the removed legacy implementation.
