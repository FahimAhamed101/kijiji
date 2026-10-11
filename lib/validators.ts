import { z } from 'zod'
import { PRODUCT_STATUS, PRODUCT_CONDITIONS } from './models/Product'
import { CATEGORY_GROUPS } from './models/Category'
import { USER_ROLES } from './models/User'
import { REPORT_REASONS, REPORT_STATUS } from './models/Report'
import { MESSAGE_STATUS } from './models/Message'
import { ORDER_STATUS, PAYMENT_PROVIDERS } from './models/Order'

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id')
  .nullable()
  .optional()

export const productCreateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(140),
  description: z.string().trim().max(8000).optional().default(''),
  price: z.coerce.number().min(0).default(0),
  priceOnRequest: z.boolean().optional().default(false),
  category: objectId,
  location: z.string().trim().max(120).optional().default('Canada'),
  images: z.array(z.string().trim()).optional().default([]),
  brand: z.string().trim().max(80).optional().default(''),
  condition: z.enum(PRODUCT_CONDITIONS).optional().default('used'),
  status: z.enum(PRODUCT_STATUS).optional().default('active'),
  featured: z.boolean().optional().default(false),
  urgent: z.boolean().optional().default(false),
  tags: z.array(z.string().trim()).optional().default([]),
  seller: z
    .object({
      name: z.string().trim().max(120).optional().default(''),
      phone: z.string().trim().max(40).optional().default(''),
      email: z.string().trim().max(160).optional().default(''),
      location: z.string().trim().max(160).optional().default(''),
      verified: z.boolean().optional().default(false),
    })
    .optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  group: z.enum(CATEGORY_GROUPS).optional().default('Buy & Sell'),
  description: z.string().trim().max(500).optional().default(''),
  image: z.string().trim().optional().default(''),
  order: z.coerce.number().int().optional().default(0),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email('Enter a valid email').max(160),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  role: z.enum(USER_ROLES).optional().default('editor'),
  active: z.boolean().optional().default(true),
})

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(160).optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.enum(USER_ROLES).optional(),
  active: z.boolean().optional(),
  avatarColor: z.string().trim().max(20).optional(),
})

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const messageCreateSchema = z.object({
  product: objectId,
  productTitle: z.string().trim().max(200).optional().default(''),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().default(''),
  body: z.string().trim().min(5, 'Message is too short').max(4000),
})

export const messageUpdateSchema = z.object({
  status: z.enum(MESSAGE_STATUS),
})

export const reportCreateSchema = z.object({
  product: objectId,
  productTitle: z.string().trim().max(200).optional().default(''),
  reason: z.enum(REPORT_REASONS).optional().default('other'),
  details: z.string().trim().max(2000).optional().default(''),
  reporterEmail: z.string().trim().max(160).optional().default(''),
})

export const reportUpdateSchema = z.object({
  status: z.enum(REPORT_STATUS),
})

/* ------------------------------------------------------------------ */
/* Storefront accounts                                                 */
/* ------------------------------------------------------------------ */

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')

export const memberSignupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(160),
  password,
  phone: z.string().trim().max(40).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
})

export const memberLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const memberProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  location: z.string().trim().max(120).optional(),
  /** Supply with `currentPassword` to rotate the password. */
  newPassword: password.optional(),
  currentPassword: z.string().min(1).optional(),
})

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

export const checkoutSchema = z.object({
  /**
   * Only ids and quantities come from the browser. Prices, totals, shipping and
   * tax are all re-derived server-side in `lib/money.ts` — a client that lies
   * about a price is simply ignored.
   */
  items: z
    .array(
      z.object({
        product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .min(1, 'Your cart is empty')
    .max(50, 'Too many distinct items in one order'),
  provider: z.enum(PAYMENT_PROVIDERS),
  shippingAddress: z.object({
    name: z.string().trim().min(2, 'Enter the recipient name').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email').max(160),
    phone: z.string().trim().max(40).optional().default(''),
    line1: z.string().trim().min(3, 'Enter the street address').max(160),
    line2: z.string().trim().max(160).optional().default(''),
    city: z.string().trim().min(2, 'Enter the city').max(80),
    province: z.string().trim().min(2, 'Choose a province').max(80),
    postalCode: z.string().trim().min(3, 'Enter the postal code').max(20),
    country: z.string().trim().max(80).optional().default('Canada'),
  }),
  note: z.string().trim().max(500).optional().default(''),
})

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  note: z.string().trim().max(500).optional(),
})

/** Flatten a ZodError into a single readable sentence. */
export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`).join('; ')
}
