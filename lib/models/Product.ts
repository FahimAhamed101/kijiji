import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/**
 * A listing / product advertised on the marketplace.
 */
export const PRODUCT_STATUS = ['draft', 'active', 'sold', 'archived'] as const
export type ProductStatus = (typeof PRODUCT_STATUS)[number]

export const PRODUCT_CONDITIONS = ['new', 'like-new', 'used', 'for-parts'] as const
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]

const sellerSchema = new Schema(
  {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    location: { type: String, default: '' },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
)

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, default: 0, min: 0 },
    // When true the card shows "Please Contact" instead of a price.
    priceOnRequest: { type: Boolean, default: false },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    location: { type: String, default: 'Canada', index: true },
    images: { type: [String], default: [] },
    brand: { type: String, default: '' },
    condition: { type: String, enum: PRODUCT_CONDITIONS, default: 'used' },
    status: { type: String, enum: PRODUCT_STATUS, default: 'active', index: true },
    featured: { type: Boolean, default: false, index: true },
    urgent: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    seller: { type: sellerSchema, default: () => ({}) },
  },
  { timestamps: true }
)

productSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.__v
    return ret
  },
})

// Fast listing queries: filter by status, sort by newest.
productSchema.index({ status: 1, createdAt: -1 })
productSchema.index({ title: 'text', description: 'text', tags: 'text' })

export type ProductDoc = InferSchemaType<typeof productSchema>

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) || model<ProductDoc>('Product', productSchema)

export default Product
