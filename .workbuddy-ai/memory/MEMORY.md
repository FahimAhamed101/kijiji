# kijiji-clone (Poorprice.com)

## Stack / commands
Next.js 14 App Router · TS · Tailwind · MongoDB/Mongoose 8 · RTK Query · Zod · jose · bcryptjs.
`npm run dev|build|start` · `typecheck` · `seed` (idempotent, tsx, reads `.env.local`) ·
`smoke` (= api + render + browser) · `check:gateways`. Suites take `BASE_URL`; default **3123**.

## Layout
- `app/api/**` handlers, all `runtime='nodejs'`. `app/admin/(panel)/**` behind the guard in
  `(panel)/layout.tsx`; `app/admin/login` is outside the group (public).
- `lib/models/*` one model per file; `lib/validators.ts` = Zod schemas.
- `store/*` RTK Query: one shared `api`, endpoints per domain via `injectEndpoints`.
  **Every slice must be imported in `store/index.ts` before the store is created** or its
  endpoints silently never register.
- Public pages use `SiteHeader` + `SiteFooter`; `components/StoreHydrator.tsx` (mounted once in
  `app/layout.tsx`) loads the persisted cart **and** wishlist — add future persisted slices there.
- Header order: `LocationPicker`, `AccountMenu`, `CartButton`, `WishlistButton`, Post ad —
  wishlist stays **immediately after cart** (client request).

## Single sources of truth — never duplicate
- **`lib/category-groups.ts`** (`CATEGORY_GROUPS`) sits outside `lib/models/Category.ts` (which
  imports mongoose) so clients can use it without the ODM in the browser bundle; the model
  re-exports it. A component keeping its own copy is a latent bug: add a group and its `<select>`
  has no matching `<option>`, so saving silently reassigns to the fallback.
- **`lib/site-config.ts`** — `SITE_EMAIL` (default `poorprice@yahoo.com`,
  `NEXT_PUBLIC_SITE_EMAIL` override), `PAYMENT_GATEWAY_EMAIL` alias, `SITE_NAME`, `SITE_URL`,
  `mailto()`. Client wants **one email for everything** — no second address.
- `components/CategoryPicker.tsx` is **controlled and uncontrolled**: pass `value`/`onChange` and
  the caller owns state; omit them and it self-manages and `router.push`es to `/browse`. Emits a
  `CategorySelection` union → `?category=<slug>` / `?group=<name>`. `LocationPicker.tsx` mirrors
  this for `?location=<Province>` (`''` = all Canada) and reuses the `category-menu*` CSS — its
  `.location-picker` rules in `globals.css` must stay **below** the `.category-picker` block to
  win on source order.
- Homepage (`app/page.tsx`) has **hardcoded section rails**, one per group — a new group has no
  homepage presence until you add a `<section>` (it still works in the picker/`/browse`).

## Payments (`lib/payments.ts`) — Stripe LIVE in test mode
- `.env.local` has a working **`STRIPE_SECRET_KEY=sk_test_…`** (verified via `/v1/balance`).
  **PayPal still fails**: 401 `invalid_client`, client id 81 chars (normally 80) → `rejected`.
- The `pk_test_…` publishable key is **unused** — Checkout redirects to Stripe's hosted page, so
  the app never renders a card form. Don't add Stripe.js just to use it.
- REST + `fetch`, **no vendor SDK**, so no secret can reach the client bundle.
- **A gateway is verified before it is offered** (`/v1/balance`; PayPal OAuth). Cache 10 min ok /
  60 s fail → `paymentsConfig()` and `providerEnabled()` are **async**. `PAYMENTS_DEMO=auto`
  suppresses demo the moment `anyLive` is true, so presence-only detection would let one bad key
  disable demo *and* offer a dead gateway. Never revert to `Boolean(envVar)`.
- **An unusable gateway is listed, not hidden.** `unavailable[]` carries `label`, `reason`
  (`not-configured`|`rejected`), `note`, `detail`, `envVars`; checkout shows them as selectable
  options with a `Keys missing`/`Keys rejected` chip, the exact fix, and Place order disabled.
  `redact()` masks 16+ char runs (Stripe echoes the key). **Do not go back to hiding broken
  gateways** — the client asked for this.
- **`providerEnabled('demo')` must NOT be special-cased.** It used to `return true` always, so a
  live site settled a fake "paid" order for anyone posting `provider:"demo"` — the UI hid it, the
  API honoured it. It now asks `paymentsConfig()`. Verified: `auto` + live Stripe →
  `POST {provider:'demo'}` = **400**.
- `POST /api/checkout` → `{mode:'demo', …, order}` or `{mode:'redirect', url, …}`.
  `shippingAddress` uses **`line1`** (not `street`); `orderView()` exposes `payment.{provider,status}`.
- **`npm run check:gateways`** — reads `.env.local`, probes both gateways, flags mis-shaped
  values, retries PayPal swapped, exits 1 on any rejection. Use it *before* debugging checkout.

## Verification (4 suites, ~198 checks)
`smoke-commerce.mjs` (API: pricing, tamper resistance, auth realms, order state machine,
payment-config truth, real Stripe session creation) · `smoke-render.mjs` (SSR HTML) ·
`smoke-browser.mjs` (Chromium: purchase + account + admin + wishlist; shots to `.shots/`) ·
`check-staff-signin.mjs`.
- **Both smoke suites require `PAYMENTS_DEMO=on` on the server** and FATAL-exit otherwise. The
  order lifecycle needs a *synchronous* provider; only demo settles in-process — Stripe/PayPal
  hand off to a hosted page the scripts can't drive. `auto` (production) hides demo once a
  gateway works. So: `PAYMENTS_DEMO=on node node_modules/next/dist/bin/next start -p 3123`.
- **A real shell env var overrides `.env.local`** in Next.js — that's what makes this work.
- Never hard-code a derivable count. A 200 on a port is not proof it is *your* server — check an
  identity field + owning PID.
- listing/cart/checkout are **client-rendered**, so SSR HTML only shows `Loading listing…`;
  buy-box facts must be checked in the browser. Against `next dev`, wait ~2.5 s after a form
  appears before typing — filling a controlled input before hydration leaves state empty and
  submit fails "field is required".

## Two sign-in doors — do not merge
Staff are `User`, shoppers are `Member`; separate cookies and lifetimes.

| Who | Page | Endpoint | Cookie |
|---|---|---|---|
| Shoppers/sellers | `/signin` | `/api/account/login` | `kijiji_session` (30d) |
| Staff/admin | `/admin/login` | `/api/auth/login` | `kijiji_admin_session` (8h) |

`/api/account/login` detects staff credentials → `403 {useAdminSignIn:true}` → `/signin` renders a
link. **Fires only when the password is actually correct** for the staff account; that's what
stops it being an enumeration oracle. Unknown email / wrong password must stay a generic 401.

## Roles / seeded accounts
`admin` all incl. deletes + staff · `editor` listings & categories · `moderator` inbox + reports +
edit listings. Enforced in `lib/auth.ts` `requireRole` + inline per route.
`admin@kijiji.local`/`admin123` · `editor@kijiji.local`/`editor123` ·
`shopper@poorprice.com`/`shopper123` (**storefront member**, not staff).

## Storefront state (cart + wishlist)
Redux mirrored to `localStorage` (`poorprice.cart.v1`, `poorprice.wishlist.v1`) so a guest can
shop without an account.
- Count/total/heart renderers must gate on the slice's `hydrated` flag — the server has no storage
  and renders the empty state, so painting the real value on first client render is a hydration
  mismatch.
- **Prices in these slices are display-only** — `POST /api/checkout` re-prices from MongoDB.
- A `<button>` must never nest inside a card's wrapping `<a>` — invalid HTML, and the click
  navigates instead of adding.

## Seed data
48 categories / 9 groups. `Antiques & Collectibles` (25) uses picsum placeholders because the
homepage skips categories with an empty `image`. Products carry real `"City, Province"`
locations so the location filter has something to match.

## Machine constraints (non-obvious)
- `mongodb+srv://` SRV lookups are refused locally — keep `MONGODB_URI_FALLBACK` (explicit
  `host1,host2,host3`) populated; the helper falls back automatically.
- DB/network calls and localhost curl need the sandbox disabled. Quote the glob:
  `curl --noproxy '*'`.
- **Rebuild sequence that works** (stop servers first): (1) `rm -rf .next` as its own command so
  the fail-closed delete shim doesn't trip; (2) `node node_modules/next/dist/bin/next build`;
  (3) `PAYMENTS_DEMO=on node …/next start -p 3123`. **Do not `mv .next /tmp/…` before a build** —
  that left `.next` in a state where the build died with a reproducible
  `EPERM: … open '…\.next\trace'` and no `BUILD_ID`. `npx` is swallowed here (exits 0, no output).
- **Port 3000 is usually a stale `next dev` for THIS project and shares `.next` with the `next
  start` on 3123.** Whichever rebuilds wins; the other serves broken chunks (500s on
  `/_next/static/**`, renders but never hydrates). **Never run both.**
- Kill a Windows PID from Git Bash with path conversion off:
  `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' taskkill /F /PID <pid>`.
- `Model.bulkWrite` rejects Mongoose `Query` objects — pass plain
  `{updateOne:{filter,update,upsert}}` ops typed as `Parameters<typeof Model.bulkWrite>[0]`.
- **Browser verification** on Windows: no agent-browser; drive Chromium via `playwright-core` from
  `~/.workbuddy-ai/binaries/node/workspace` using `createRequire('<workspace>/')` — `NODE_PATH`
  does **not** work in ESM. Needs the sandbox disabled or it's SIGTERM'd with no output. Full
  recipe in the `browser-verify-ui-change` skill.
- Disk runs near-full; a screenshot write can fail with `ENOSPC` while the app is fine.
