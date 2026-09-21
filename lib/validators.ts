import { z } from 'zod'
import { PRODUCT_STATUS, PRODUCT_CONDITIONS } from './models/Product'
import { CATEGORY_GROUPS } from './models/Category'
import { USER_ROLES } from './models/User'
import { REPORT_REASONS, REPORT_STATUS } from './models/Report'
import { MESSAGE_STATUS } from './models/Message'

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

/** Flatten a ZodError into a single readable sentence. */
export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`).join('; ')
}
