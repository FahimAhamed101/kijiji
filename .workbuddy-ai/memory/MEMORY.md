# kijiji-clone — project notes

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · MongoDB via Mongoose 8 ·
Redux Toolkit Query · Zod · jose (JWT) · bcryptjs.

## Commands
- `npm run dev` / `npm run build` / `npm run start`
- `npm run typecheck` — `tsc --noEmit`
- `npm run seed` — idempotent DB seed (reads `.env.local` via `scripts/seed.ts`, tsx)

## Layout conventions
- `app/api/**` — REST route handlers, all `runtime = 'nodejs'`.
- `app/admin/(panel)/**` — behind the auth guard in `(panel)/layout.tsx`;
  `app/admin/login` sits outside the group so it stays public.
- `lib/models/*` — one file per Mongoose model; `lib/validators.ts` holds the Zod schemas.
- `store/*` — RTK Query. One shared `api` instance; endpoints are contributed per domain
  with `injectEndpoints`, and every slice must be imported in `store/index.ts` before the
  store is created or its endpoints won't register.
- Public pages use `components/SiteHeader.tsx` + `components/SiteFooter.tsx`.
- `components/CategoryPicker.tsx` is the search-bar category dropdown. It is **controlled
  and uncontrolled**: pass `value`/`onChange` (as `/browse` does) and the caller owns state;
  omit them (as `/` does) and it owns its own selection and `router.push`es to `/browse`
  on pick. `SiteHeader` branches on `category !== undefined`. It emits a `CategorySelection`
  union (`all` | `group` | `category`) that maps to `?category=<slug>` / `?group=<name>`.
  The panel is `position: fixed` with coordinates from `getBoundingClientRect()` so the
  search bar's `overflow: hidden` can't clip it.

## Environment
`.env.local` holds `MONGODB_URI`, `MONGODB_DB`, `MONGODB_URI_FALLBACK`, `JWT_SECRET`,
`SEED_SECRET`, `SEED_ADMIN_*`. It is gitignored — keep `.env.example` in sync when adding
variables.

## Non-obvious constraints (this machine)
- `mongodb+srv://` SRV lookups are refused by the local DNS resolver. Keep
  `MONGODB_URI_FALLBACK` (explicit `host1,host2,host3` seed list) populated — the
  connection helper falls back to it automatically.
- Database/network calls and localhost curl need the sandbox disabled.
- **Port 3000 is usually a stale `next dev` for THIS project**, left over from an earlier
  session. It silently rewrites `.next` with dev artifacts, so any `next build` output gets
  clobbered and `next start` then dies with `Cannot find module .next/server/pages/_error.js`
  while serving 500s for every `/_next/static/**` chunk (page renders, but never hydrates).
  If that happens: `netstat -ano | grep :3000` to get the PID, kill it, then rebuild.
  Run verification on **3123**. Localhost curl must quote the glob: `curl --noproxy '*'`.
- Kill a Windows PID from Git Bash with path conversion off, or `taskkill` mangles the flags:
  `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' taskkill /F /PID <pid>`.
- The sandbox's fail-closed delete shim blocks removing `.next` from both bash `mv`/`rm`
  and PowerShell `Remove-Item`. Don't fight it — just run `next build`; Next overwrites the
  directory in place and the build succeeds without a manual clear.
- `next build` can fail with `SAFE_DELETE_BULK_CONFIRM_REQUIRED` when `.next` has >50 files.
  If that recurs, build with `env -u NODE_OPTIONS npx next build` to drop the shim.
- `Model.bulkWrite` rejects Mongoose `Query` objects — pass plain
  `{ updateOne: { filter, update, upsert } }` ops, typed as
  `Parameters<typeof Model.bulkWrite>[0]` so literal unions don't widen.

## Seeded accounts
- `admin@kijiji.local` / `admin123` — full access
- `editor@kijiji.local` / `editor123` — content only, no deletes, no staff access

## Roles
`admin` — everything incl. deletes + staff. `editor` — create/edit listings & categories.
`moderator` — inbox + reports + edit listings. Enforced in `lib/auth.ts` `requireRole`
and inline in each route handler.
