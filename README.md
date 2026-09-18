# Marketplace Clone (Next.js + Tailwind)

A front-end-only clone of a classifieds marketplace homepage and listing
detail page, built with **Next.js 14 (App Router)**, **TypeScript**, and
**Tailwind CSS**. No backend — all data is mocked in `data/listings.ts`.

> Note: brand name, logo wordmark, and photography have been re-created with
> a generic name and colour swatches rather than reproducing the original
> site's exact branding/photos, to keep this a clean original implementation
> you can safely reuse.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

- `/` — homepage: search header, category nav, horizontal listing rails,
  category tile grids (Autos, Real Estate, Buy & Sell), membership banner.
- `/listing/[id]` — listing detail page: image gallery, price/title block,
  save/share actions, key-facts grid, expandable description, seller
  sidebar card, "Listed By" stats, and a similar-listings rail.

## Project structure

```
app/
  layout.tsx            Root layout (Header + Footer wrap every page)
  page.tsx               Homepage
  listing/[id]/page.tsx  Listing detail page
  globals.css            Tailwind directives + small utilities
components/
  Header.tsx
  Footer.tsx
  ListingCard.tsx        Small card used in horizontal rails
  ListingRail.tsx        Titled, scrollable row of ListingCards
  CategoryTiles.tsx      Category promo tile grid
  ListingGallery.tsx     Listing photo gallery (client component)
  Description.tsx        Expandable description (client component)
  SellerCard.tsx         Sidebar seller/contact card
data/
  listings.ts             Mock listings + seeded listing detail
```

## Customizing

- Swap the flat colour placeholders in `data/listings.ts` and
  `ListingGallery.tsx` for real images via `next/image` once you have
  licensed photography or your own uploads.
- Brand colour lives in `tailwind.config.ts` under `theme.extend.colors.brand`.
- Wire up real data by replacing the imports from `data/listings.ts` with
  calls to your API/database.
