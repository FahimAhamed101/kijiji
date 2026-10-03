/**
 * Top-level navigation groups shown in the header (Buy & Sell, Autos, ...).
 *
 * This lives in its own module — deliberately free of any mongoose import — so
 * client components (the admin category editor, for instance) can share the
 * canonical list without dragging the ODM into the browser bundle. The Category
 * model re-exports from here, so there is still exactly one source of truth.
 */
export const CATEGORY_GROUPS = [
  'Buy & Sell',
  'Antiques & Collectibles',
  'Cars & Vehicles',
  'Real Estate',
  'Jobs',
  'Services',
  'Pets',
  'Community',
  'Vacation Rentals',
] as const

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number]
