import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/** Fulfilment state of an order, in the order it normally progresses. */
export const ORDER_STATUS = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof ORDER_STATUS)[number]

/** Which gateway took the money. `demo` is the simulated sandbox provider. */
export const PAYMENT_PROVIDERS = ['stripe', 'paypal', 'demo'] as const
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number]

export const PAYMENT_STATUS = ['unpaid', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUS)[number]

/**
 * A line item.
 *
 * Price and title are **copied** onto the order rather than referenced. If the
 * seller later edits or deletes the listing, the order must still show what the
 * customer actually bought and at what price.
 */
const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    title: { type: String, required: true },
    slug: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String, default: '' },
    sellerName: { type: String, default: '' },
  },
  { _id: false }
)

const addressSchema = new Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'Canada' },
  },
  { _id: false }
)

const paymentSchema = new Schema(
  {
    provider: { type: String, enum: PAYMENT_PROVIDERS, default: 'demo' },
    status: { type: String, enum: PAYMENT_STATUS, default: 'unpaid', index: true },
    /** Gateway-side id: Stripe session id, or the PayPal order id. */
    reference: { type: String, default: '' },
    /** Amount the gateway confirmed, kept for reconciliation. */
    amount: { type: Number, default: 0 },
    paidAt: { type: Date, default: null },
  },
  { _id: false }
)

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    /**
     * Random per-order secret. Guests have no session, so the confirmation page
     * proves it is allowed to read the order by presenting this token. Without
     * it, order ids would be the only thing standing between a stranger and
     * someone else's name, address and phone number.
     */
    accessToken: { type: String, required: true, index: true, select: false },

    // Null for guest checkout.
    member: { type: Schema.Types.ObjectId, ref: 'Member', default: null, index: true },
    /** Denormalised so we can find a guest's orders without a member record. */
    customerEmail: { type: String, default: '', lowercase: true, trim: true, index: true },
    customerName: { type: String, default: '' },

    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'CAD' },

    shippingAddress: { type: addressSchema, default: () => ({}) },
    payment: { type: paymentSchema, default: () => ({}) },

    status: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    /** Internal fulfilment note, editable from the admin panel. */
    note: { type: String, default: '' },
  },
  { timestamps: true }
)

orderSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.accessToken
    return ret
  },
})

orderSchema.index({ createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

export type OrderDoc = InferSchemaType<typeof orderSchema>

export const Order: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) || model<OrderDoc>('Order', orderSchema)

export default Order
