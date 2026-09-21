# Marketplace Clone (Next.js + MongoDB + RTK Query)

A classifieds marketplace with a **public site** and a full **admin panel**,
built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
**MongoDB (Mongoose)**, and **Redux Toolkit Query**.

> Note: brand name, logo wordmark, and photography have been re-created with a
> generic name and stock imagery rather than reproducing the original site's
> exact branding/photos.

## Features

**Public site**

- `/` — homepage: search header, category nav, listing rails and category tiles,
  all served from MongoDB.
- `/browse` — searchable, filterable listing grid (keyword, category, group,
  featured, sort, pagination). Filters are reflected in the URL so results are
  shareable.
- `/listing/[slug]` — listing detail with image gallery, specs, seller card,
  phone reveal, **Send message** (writes to the DB inbox) and **Report listing**.

**Admin panel** (`/admin`)

- Cookie-based session auth (JWT, httpOnly) with three roles.
- Dashboard: KPIs, listings-per-category chart, recent activity.
- Listings: search/filter/sort, pagination, bulk publish/draft/sold/delete,
  duplicate-as-draft, full create/edit form with image and tag managers.
- Categories: create/edit, reorder, toggle visibility, feature/unfeature,
  safe delete (blocked while listings still reference it).
- Messages: inbox with unread badges, status workflow, detail view, reply.
- Reports: abuse queue with reviewing / resolved / dismissed workflow.
- Staff: create/edit accounts, role assignment, password reset, activate
  or disable, last-active-admin protection.

## Getting started

```bash
npm install

# 1. Configure the database connection
cp .env.example .env.local     # then edit MONGODB_URI

# 2. Create the admin user, categories and sample listings
npm run seed

# 3. Run it
npm run dev
```

Open http://localhost:3000 — the admin panel is at http://localhost:3000/admin.

### Seeded credentials

| Role   | Email                 | Password    | Can do                                    |
| ------ | --------------------- | ----------- | ----------------------------------------- |
| Admin  | `admin@kijiji.local`  | `admin123`  | Everything, including deletes and staff    |
| Editor | `editor@kijiji.local` | `editor123` | Create/edit listings and categories        |

Change these before deploying (see `SEED_ADMIN_*` in `.env.local`).

## Environment variables

| Variable            | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `MONGODB_URI`       | Connection string, e.g. `mongodb+srv://…/ecomkiji`              |
| `MONGODB_DB`        | Database name (defaults to `ecomkiji`)                          |
| `MONGODB_URI_FALLBACK` | Optional seed-list URI, used only if the SRV DNS lookup fails |
| `JWT_SECRET`        | Signs the admin session cookie — set a long random string        |
| `SEED_SECRET`       | Required by `POST /api/seed`                                    |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | Seeded admin account |

> **SRV note:** `mongodb+srv://` URIs need a DNS SRV lookup. Some routers and
> corporate resolvers refuse those queries (`querySrv ECONNREFUSED`). If that
> happens the app automatically retries with `MONGODB_URI_FALLBACK`, which is the
> same cluster written as an explicit `host1,host2,host3` seed list.

## Seeding

```bash
npm run seed                                  # CLI (reads .env.local)
curl -X POST "localhost:3000/api/seed?secret=$SEED_SECRET"   # or over HTTP
```

Both paths are idempotent — they upsert on a unique key, so re-running is safe.

## API

| Method | Route                     | Auth        | Notes                            |
| ------ | ------------------------- | ----------- | -------------------------------- |
| POST   | `/api/auth/login`         | public      | Sets the session cookie          |
| POST   | `/api/auth/logout`        | public      | Clears the cookie                |
| GET    | `/api/auth/me`            | public      | Current session or `null`        |
| GET    | `/api/products`           | public      | `q, status, category, group, featured, sort, page, limit` |
| POST   | `/api/products`           | staff       | Create                           |
| GET    | `/api/products/:idOrSlug` | public      | `?noview=1` skips the view count |
| PATCH  | `/api/products/:id`       | staff       | Update                           |
| DELETE | `/api/products/:id`       | admin       | Delete                           |
| GET    | `/api/categories`         | public      | `group, featured, withCounts`    |
| POST   | `/api/categories`         | staff       | Create                           |
| PATCH  | `/api/categories/:id`     | staff       | Update                           |
| DELETE | `/api/categories/:id`     | admin       | Blocked if listings still use it |
| GET    | `/api/messages`           | staff       | Inbox                            |
| POST   | `/api/messages`           | public      | Contact form                     |
| GET    | `/api/reports`            | staff       | Moderation queue                 |
| POST   | `/api/reports`            | public      | Report a listing                 |
| GET    | `/api/users`              | admin       | Staff accounts                   |
| GET    | `/api/stats`              | staff       | Dashboard metrics                |
| POST   | `/api/seed`               | `SEED_SECRET` | Bootstrap the database         |

## Project structure

```
app/
  layout.tsx              Root layout (Redux + RTK Query providers)
  error.tsx               Branded error boundary
  not-found.tsx           Branded 404
  page.tsx                Homepage
  browse/page.tsx         Search / browse
  listing/[id]/page.tsx   Listing detail
  admin/
    login/page.tsx        Sign in (public)
    (panel)/              Everything behind the auth guard
      layout.tsx          Server-side session check + AdminShell
      page.tsx            Dashboard
      products/           Listings CRUD (+ new/, [id]/ edit)
      categories/         Category CRUD
      messages/           Inbox
      reports/            Moderation queue
      users/              Staff accounts
  api/                    REST route handlers
lib/
  mongodb.ts              Cached Mongoose connection (+ SRV fallback)
  auth.ts                 JWT session helpers
  password.ts             bcrypt hashing
  models/                 User, Product, Category, Message, Report
  seed.ts                 Seed data + idempotent runner
  validators.ts           Zod schemas for every write endpoint
store/
  api.ts                  RTK Query base (fetchBaseQuery + tag types)
  productsApi.ts          Product endpoints
  categoriesApi.ts        Category endpoints
  usersApi.ts             Staff endpoints
  inboxApi.ts             Messages + reports endpoints
  authApi.ts              Session + dashboard stats
  types.ts                Shared types and formatting helpers
components/
  Providers.tsx           Redux provider
  SiteHeader.tsx          Public header (search + category nav)
  SiteFooter.tsx          Public footer
  BrowseClient.tsx        Browse/search results UI
  admin/                  Admin UI kit, shell, product form
scripts/
  seed.ts                 CLI seed runner
```

## Scripts

| Script              | Purpose                        |
| ------------------- | ------------------------------ |
| `npm run dev`       | Development server             |
| `npm run build`     | Production build               |
| `npm run start`     | Serve the production build     |
| `npm run typecheck` | `tsc --noEmit`                 |
| `npm run seed`      | Seed the database              |

## Notes

- The admin session is an httpOnly cookie signed with `JWT_SECRET`; the panel
  verifies it on the server before rendering any protected markup, so there is no
  flash of protected UI.
- `app/error.tsx` and `app/not-found.tsx` provide branded failure states.
- Brand colour lives in `tailwind.config.ts` under `theme.extend.colors.brand`.
- The public pages fetch through RTK Query on the client, so the first paint shows
  a skeleton and content arrives after hydration. If you need SEO-indexable listing
  copy, move the data fetching for those routes into server components.
- Security: `admin:admin` on a publicly reachable Atlas cluster is not safe. Rotate
  the database password and set a long random `JWT_SECRET` before deploying.
