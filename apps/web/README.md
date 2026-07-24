# PharmaSY Frontend

A from-scratch Next.js 15 + TypeScript + Tailwind v4 frontend for PharmaSY, a
B2B Pharmacy Operating System connecting pharmacies, suppliers, and
administrators. Premium enterprise-SaaS quality (Stripe / Linear / Vercel /
Raycast tier), with a professional medical-red identity and full Arabic
(RTL, default) / English (LTR) support.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` produces a production build (the
first build fetches IBM Plex Sans Arabic + Inter from Google Fonts, so make
sure you have network access the first time).

## Stack

- Next.js 15 (App Router, TypeScript, `src/` directory)
- Tailwind CSS v4 (token-based theme in `src/app/globals.css`)
- Framer Motion (scroll reveals, the scroll-expansion hero, counters, header/menu motion)
- Radix UI primitives (Dropdown Menu, Tabs, etc.) with custom styling
- lucide-react icons, recharts, sonner (toasts)

## What changed in this design pass

- **Color system** — replaced the blue identity with a full medical-red scale
  (`--red-50` → `--red-900`, exposed as `bg-brand-*` / `text-brand-*` /
  `border-brand-*`). Destructive/danger states use a separate rust-orange
  scale so they never get confused with the brand color. Update the palette
  in one place — `src/app/globals.css` — and it propagates through every
  screen, including the three role dashboards.
- **Typography** — tighter tracking and refined type scale for LTR, more
  generous line-height for Arabic (RTL body copy runs at 1.85 line-height;
  headings at 1.5) so Arabic never reads like a translated afterthought.
- **Hero** — `src/components/blocks/scroll-expansion-hero.tsx` implements a
  scroll-hijacking "media expansion" intro: a full-bleed photo starts small,
  expands as the user scrolls (or swipes on mobile), then releases into the
  normal page with a fade-in. It ships with placeholder Unsplash imagery —
  **swap `HERO_BG` / `HERO_MEDIA` in `src/app/page.tsx` for real product or
  brand photography** before shipping.
- **Scroll motion** — `src/components/shared/reveal.tsx` (fade/slide/stagger
  on scroll) and `animated-counter.tsx` (count-up stats, fires once) are used
  throughout the landing page: features grid, stats band, testimonials.
- **Buttons/cards/inputs** — refined hover elevation, press feedback
  (`active:scale-[0.98]`), softer borders, layered shadows (`--shadow-xs` →
  `--shadow-lg`, plus a `--shadow-glow` for primary buttons). Added an
  `outline` button variant and an `InteractiveCard` (hover lift + border
  tint) alongside the base `Card`.
- **Navigation** — header now tracks scroll position (transparent → blurred
  surface), highlights the active in-page section with an animated
  underline, and includes a real mobile menu (slide-down, Framer Motion).
- **Footer** — clearer hierarchy, more generous spacing, subtle top-border
  accent line.

## Structure

```
src/
  app/
    page.tsx                  # Marketing home page (scroll-expansion hero + sections)
    (public)/                 # Login, register, forgot-password, 403, about, pricing, contact
    not-found.tsx             # 404
    pharmacy/ | supplier/ | admin/   # Role dashboards (unchanged IA, inherit the new palette)
  components/
    blocks/scroll-expansion-hero.tsx  # Scroll-hijack hero media component
    ui/                        # Button, Input, Card, Badge, Table, Tabs, Dropdown, Skeleton
    layout/                    # Sidebar, topbar, dashboard shell, auth layout, public header/footer
    shared/                    # PageHeader, StatCard, Reveal/RevealGroup/RevealItem, AnimatedCounter
  lib/
    utils.ts                   # cn() class merge helper
    i18n.tsx                   # AR/EN + RTL language context (Arabic is the default locale)
    content/home.ts            # Fully bilingual landing-page copy
    nav-config.tsx              # Sidebar nav definitions per role
```

## Design tokens

All colors, radii, and shadows live as CSS variables in
`src/app/globals.css` under `:root`, exposed to Tailwind via `@theme inline`
(`bg-brand-600`, `text-success-600`, `border-border`, `shadow-[var(--shadow-md)]`,
etc.). No component hardcodes a color — change the palette once, everywhere
updates, dashboards included.

## i18n / RTL

`useLocale()` (`src/lib/i18n.tsx`) toggles `<html dir="rtl|ltr">`, swaps the
font stack, and defaults to Arabic. Landing-page copy lives in
`src/lib/content/home.ts` as fully separate AR/EN content (not machine
translation) — extend that file for more sections, or swap in `next-intl`
for URL-based locales (`/en/...`, `/ar/...`) if you need indexable
language routes; the component structure won't need to change.

## Not yet touched

Per the brief, this pass is scoped to visual/UX polish, not information
architecture: the three dashboards (pharmacy/supplier/admin) keep their
existing pages and layout, and automatically inherit the new red palette and
refined Button/Card/Input components. Sub-pages not yet built (categories,
cart, checkout, settings, etc.) still follow the notes in the previous
README pass — copy an existing page in the same folder and adjust.

## Connecting to the real backend

No API calls are wired up — every list, stat, and table uses local mock data
so you can drop this straight into your existing backend.

## Interaction & polish pass (latest)

- **Fonts** — English is Inter, Arabic is Cairo (`src/app/layout.tsx`).
- **Loader** — `src/components/shared/pill-loader.tsx` is a brand-red capsule
  loading animation, wired into `src/app/loading.tsx` as the route-level
  loading state. Respects `prefers-reduced-motion`.
- **Product card** — `src/components/shared/product-card.tsx` (image / title
  + description / price + add-to-cart button), used in the marketplace page.
  No hover-lift on the image, only a soft shadow transition.
- **AnimatedNumber** — `src/components/shared/animated-number.tsx` replaced
  the old landing-page-only counter. `StatCard` now accepts an optional
  `animatedValue` (+`format`/`prefix`/`suffix`) and every dashboard KPI card
  counts up once on scroll-into-view; respects reduced motion.
- **Mobile dashboard navigation** — dashboards previously had no way to open
  the sidebar on mobile. `Sidebar` now exposes a shared `SidebarNav`, used by
  both the desktop rail and a new `MobileSidebarDrawer` (slide-in, closes on
  navigation or backdrop click), triggered from a hamburger button in
  `Topbar`.
- **Clickable logo** — the sidebar logo now links to that role's dashboard
  home (`sections[0].items[0].href`), matching the public header logo which
  already links to `/`.
- **Cursor & disabled states** — audited raw `<button>` elements across
  layout/dashboard components and added explicit `cursor-pointer` (native
  buttons default to `cursor: default`, not pointer); `Button` now also shows
  `cursor-not-allowed` when disabled.
- **RTL logical properties** — swapped a few remaining physical
  left/right utilities (search icon, notification dot, active nav border,
  mobile drawer side) for logical `start/end` equivalents so they mirror
  correctly in RTL instead of just visually "looking okay" by accident.
- **Animation timing pass** — dropdown/menu reveal tightened to ~300ms;
  removed a larger icon hover-scale in favor of a subtler color shift, in
  line with "smooth, purposeful, never flashy" motion guidance.

## About the enterprise-scale roadmap brief

One of the design briefs in this thread describes PharmaSY's long-term vision
as a full production SaaS: real auth/RBAC, TanStack Query + Zustand +
Axios + Zod, next-intl, Dexie/PWA offline sync, Socket.io notifications, and
entire AI/finance/multi-country modules — implying an existing production
codebase with a NestJS backend already built.

That does not describe what exists in this repository. Everything here is a
frontend-only visual prototype: static/mock data inline in each page, no
state-management libraries, no API client, no auth. Treat the enterprise
brief as a roadmap/spec to scope future work against, not as a description
of this codebase's current state — building all of it (dozens of features,
a full data layer, offline sync, AI/finance modules) is a multi-week
engineering effort, not something to fabricate in one pass. See the note
left at the end of the assistant's reply in that conversation for suggested
next slices to tackle first (architecture foundation → one real feature
vertical → roadmap-shell pages).

## Architecture foundation (latest pass)

Added the approved stack from the enterprise roadmap brief and wired one
feature vertical end-to-end to prove the pattern, without attempting the
full 200+ page roadmap in one pass (see the scope note above).

- **TanStack Query** — `src/providers/query-provider.tsx`, wrapped around
  the whole app in `src/app/layout.tsx`.
- **Zustand** — `src/stores/cart-store.ts`, a genuine client-state example
  (persisted cart, grouped by supplier for the eventual multi-supplier
  checkout). Server data should live in Query's cache, not in a store.
- **Axios API client** — `src/lib/api-client.ts`: single instance, auth
  header injection point, normalized `ApiError` shape, refresh-flow TODO
  clearly marked. No page should call `axios` directly — go through a
  feature's repository instead.
- **Feature flags** — `src/lib/feature-flags.ts` (the exact flag set from
  the brief) plus `src/components/shared/feature-flag.tsx` to gate UI.
- **Permissions** — `src/lib/permissions.ts` (`can()` / `canAny()` /
  `canAll()` over a role→permission map) plus
  `src/components/shared/permission-gate.tsx` to protect actions, not just
  hide menu items.
- **Feature-vertical example: inventory** —
  `src/features/inventory/api/{inventory.types,inventory.repository,
  inventory.mock-repository,inventory.repository.instance,
  inventory.query-keys}.ts` + `hooks/use-inventory.ts`. The pharmacy
  inventory page now consumes `useInventoryOverview()` /
  `useInventoryProducts()` instead of hardcoded arrays, with real
  loading-skeleton and empty states, and shows available/reserved/total
  quantity as separate numbers (never one generic count) with nearest
  batch expiry — matching the batch-based inventory model described in the
  brief.

**To connect a real backend for this feature**: add
`inventory.http-repository.ts` implementing `InventoryRepository` against
`apiClient`, then change one line in `inventory.repository.instance.ts`.
No page or hook changes needed. Repeat this exact pattern
(`types → repository interface → mock repository → instance → query-keys →
hooks`) for each remaining feature (orders, marketplace, exchange,
notifications, reports, ai, finance, …) as the backend for each becomes
available.

## Marketplace + Orders (latest pass)

Both follow the exact same repository pattern as inventory.

- **Marketplace** — `src/features/marketplace/`. The pharmacy marketplace
  page now has real client-side search + category filtering wired through
  `useMarketplaceProducts({ search, categoryId })` and
  `useMarketplaceCategories()`, with loading skeletons and a real empty
  state. "Add to cart" now calls the shared `useCartStore` and shows a
  toast — the cart badge in the sidebar is still a static "3" placeholder
  (next step: derive it from `useCartStore` line count).
- **Orders** — `src/features/orders/`. The pharmacy orders page's status
  tabs are now real filters (`useOrders({ status, search })`, backed by
  Radix Tabs' controlled `value`/`onValueChange`), plus loading and empty
  states. Pagination is still the static "Previous/Next" UI from before —
  real pagination needs a page-size/cursor convention added to the
  repository interface, intentionally deferred rather than faked.

**Not yet migrated to this pattern**: supplier orders/products pages and
all admin pages still use the inline hardcoded arrays from the first pass.
Same recipe applies — a `features/<name>/api/*` + `hooks/use-*.ts` pair,
then swap the page's data source.

## Exchange marketplace (latest pass)

Per the stated priority (Exchange is second priority after Marketplace/
Orders/Sync), built next — same repository pattern, plus the first real
form + mutation in the app.

- **`src/features/exchange/`** — types, repository interface, mock
  repository (with genuine in-memory `createListing`), instance, query
  keys, and hooks (`useExchangeListings`, `useExchangeListing`,
  `useCreateExchangeListing`).
- **`src/components/ui/dialog.tsx`** — new primitive (Radix Dialog),
  needed for the create-listing flow and reusable for any future
  confirm/edit dialog.
- **`/pharmacy/exchange`** — Browse / My listings tabs, search, status
  badges (pending review / active / paused / sold / expired / rejected),
  available vs reserved quantity shown separately, and a "Create listing"
  dialog built with **React Hook Form + Zod** (`schemas/create-listing.schema.ts`)
  — the first real form-with-validation pattern in the codebase; copy this
  shape for every future create/edit form instead of building forms ad hoc.
- Added "Exchange" to the pharmacy sidebar nav.
- **Cart badge is now live** — the sidebar's Cart count reads from
  `useCartStore` instead of a hardcoded "3", updating as products are added
  from the marketplace.

Still not implemented for exchange: purchase/reservation flow (stock
locking, oversell prevention), listing moderation (admin side), and
edit/pause/expire actions on "My listings" — the "Manage"/"Purchase"
buttons on each card are inert for now.

**Next up per the roadmap**: notifications, then supplier-side pages
migrated to the same pattern, then admin, then reports/analytics, then the
future-flagged AI/finance modules.

## Notifications (latest pass)

Real-time-ready notification center, same repository pattern, shared across
all three roles instead of duplicated per-dashboard.

- **`src/features/notifications/`** — types, repository interface, mock
  repository (mutable read-state, `markAsRead`/`markAllAsRead`), instance,
  query keys, hooks (`useNotifications`, `useUnreadNotificationCount`,
  `useMarkNotificationRead`, `useMarkAllNotificationsRead`).
- **`NotificationBell`** (`components/shared/notification-bell.tsx`) —
  replaced the old static bell icon in `Topbar`. Shows a live unread badge
  (polls every 30s — swap for a socket push once real-time notifications
  are connected, per the TODO in `notifications.repository.instance.ts`),
  a dropdown with the 5 most recent notifications, click-to-mark-read, and
  a link to the full center.
- **`NotificationCenter`** (`features/notifications/components/`) — one
  shared list component (all/unread tabs, loading/empty states) used by
  `/pharmacy/notifications`, `/supplier/notifications`, and
  `/admin/notifications` instead of three copies of the same markup.
- `DashboardShell`/`Topbar` now derive `notificationsHref` from the nav
  sections the same way the sidebar derives its home link — no per-page
  wiring needed when a new role dashboard is added later.

**Next up**: supplier-side pages migrated to the repository pattern
(products/orders currently still hardcoded), then admin, then
reports/analytics, then the future-flagged AI/finance modules.

## Supplier-side pages (latest pass)

Migrated the last two hardcoded pages to the repository pattern.

- **`src/features/supplier-products/`** — list + a real `toggleAvailability`
  mutation (the power-icon button in the table actually flips
  active/inactive now, with a toast).
- **`src/features/supplier-orders/`** — modeled separately from the
  pharmacy-side `orders` feature (different shape: `pharmacyName` instead
  of `supplierName`, a 3-stage `new → confirmed → shipped` status instead
  of the pharmacy's 4-stage one) since a supplier's incoming order and a
  pharmacy's placed order are genuinely different views, not the same data
  reshaped. The "Confirm order" / "Mark shipped" button now calls
  `useUpdateSupplierOrderStatus()` and advances the order for real.

Every page in the app (all three dashboards' primary pages) now goes
through TanStack Query + a typed repository instead of an inline hardcoded
array — pharmacy dashboard/inventory stats are still hardcoded numbers
inline in the page (not yet a feature module) but everything list-shaped
(marketplace, orders, exchange, notifications, supplier products/orders)
is wired.

**Next up**: admin pages (organizations/approvals — currently still
hardcoded), then reports/analytics, then the future-flagged AI/finance
modules.

## Admin pages (latest pass)

- **`src/features/admin-organizations/`** — list + search, plus real
  `suspend`/`reactivate` mutations wired to the row action icon (was
  previously just a static badge with no actions).
- **`src/features/admin-approvals/`** — pending queue with real
  `approve`/`reject` mutations; approving or rejecting actually removes the
  card from the list (in-memory) and shows a genuine empty state ("all
  caught up") once the queue is clear, instead of always showing the same
  3 static cards.

All primary pages across all three dashboards (pharmacy, supplier, admin)
now go through TanStack Query + a typed repository — no more inline
hardcoded arrays except the dashboard overview/stat pages themselves,
which remain simple display-only numbers by design (see the note in the
previous pass).

**Next up per the roadmap**: reports/analytics, then the future-flagged
AI/finance modules (built as complete mock-backed pages with a small
"Future feature" badge, not empty "Coming soon" placeholders, per the
brief).
