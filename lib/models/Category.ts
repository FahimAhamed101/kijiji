import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'
import { CATEGORY_GROUPS } from '@/lib/category-groups'

/**
 * Top level navigation group shown in the header (Buy & Sell, Autos, ...).
 * Kept as a plain string field with a fixed set of values so categories can be
 * regrouped from the admin panel without a migration.
 *
 * The list itself lives in `lib/category-groups.ts` (no mongoose dependency) so
 * client components can import it too; it is re-exported here for server code
 * and for the schema enum below.
 */
export { CATEGORY_GROUPS }
export type { CategoryGroup } from '@/lib/category-groups'

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
