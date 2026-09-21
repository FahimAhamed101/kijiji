import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/**
 * Top level navigation group shown in the header (Buy & Sell, Autos, ...).
 * Kept as a plain string field with a fixed set of values so categories can be
 * regrouped from the admin panel without a migration.
 */
export const CATEGORY_GROUPS = [
  'Buy & Sell',
  'Cars & Vehicles',
  'Real Estate',
  'Jobs',
  'Services',
  'Pets',
  'Community',
  'Vacation Rentals',
] as const
export type CategoryGroup = (typeof CATEGORY_GROUPS)[number]

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    group: { type: String, enum: CATEGORY_GROUPS, default: 'Buy & Sell', index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

categorySchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.__v
    return ret
  },
})

export type CategoryDoc = InferSchemaType<typeof categorySchema>

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ||
  model<CategoryDoc>('Category', categorySchema)

export default Category
