import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'
import { getSession } from '@/lib/auth'
import { productCreateSchema, formatZodError } from '@/lib/validators'
import {
  getPagination,
  paginated,
  jsonError,
  errorMessage,
  asStringArray,
} from '@/lib/api-helpers'
import { slugify, uniqueSlug } from '@/lib/slug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Escape user input before it goes into a RegExp. */
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { views: -1 },
  title: { title: 1 },
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const sp = req.nextUrl.searchParams
    const pagination = getPagination(req, 20)

    const filter: Record<string, unknown> = {}

    // Public callers only ever see published listings. Signed-in admins can
    // pass `all=true` to see drafts and archived items too.
    const session = await getSession()
    const wantsAll = sp.get('all') === 'true'
    if (!(session && wantsAll)) {
      filter.status = { $in: ['active', 'sold'] }
    }

    const status = sp.get('status')
    if (status && status !== 'all') filter.status = status

    const featured = sp.get('featured')
    if (featured === 'true') filter.featured = true
    if (featured === 'false') filter.featured = false

    const urgent = sp.get('urgent')
    if (urgent === 'true') filter.urgent = true

    const location = sp.get('location')
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' }

    // Category accepts either a slug or a raw ObjectId.
    const category = sp.get('category')
    if (category && category !== 'all') {
      if (/^[0-9a-fA-F]{24}$/.test(category)) {
        filter.category = category
      } else {
        const cat = await Category.findOne({ slug: category }).select('_id').lean()
        filter.category = cat?._id ?? null
      }
    }

    // `group` matches every category in a navigation group (e.g. "Cars & Vehicles").
    const group = sp.get('group')
    if (group && group !== 'all' && !filter.category) {
      const groupCats = await Category.find({ group }).select('_id').lean()
      filter.category = { $in: groupCats.map((c) => c._id) }
    }

    const q = sp.get('q')?.trim()
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      filter.$or = [{ title: rx }, { description: rx }, { tags: rx }, { location: rx }]
    }

    const sort = SORTS[sp.get('sort') ?? 'newest'] ?? SORTS.newest

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('category', 'name slug group')
        .lean(),
      Product.countDocuments(filter),
    ])

    return Response.json(paginated(items, total, pagination))
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = productCreateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const data = parsed.data

    // Generate a unique slug from the title.
    let slug = slugify(data.title)
    if (!slug || (await Product.exists({ slug }))) slug = uniqueSlug(data.title)

    const product = await Product.create({
      ...data,
      slug,
      images: asStringArray(data.images),
      tags: asStringArray(data.tags),
    })

    const populated = await product.populate('category', 'name slug group')
    return Response.json(populated.toJSON(), { status: 201 })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
