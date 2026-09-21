import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/lib/models/Category'
import Product from '@/lib/models/Product'
import { getSession } from '@/lib/auth'
import { categoryCreateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'
import { slugify, uniqueSlug } from '@/lib/slug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const sp = req.nextUrl.searchParams

    const filter: Record<string, unknown> = {}
    const session = await getSession()

    // Hidden (inactive) categories are only visible to signed-in staff.
    if (!session) filter.active = true
    else if (sp.get('active') === 'true') filter.active = true
    else if (sp.get('active') === 'false') filter.active = false

    const group = sp.get('group')
    if (group && group !== 'all') filter.group = group

    if (sp.get('featured') === 'true') filter.featured = true

    const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean()

    // Attach a live product count per category (used by the admin table).
    if (sp.get('withCounts') === 'true') {
      const counts = await Product.aggregate<{ _id: unknown; count: number }>([
        { $match: { status: { $in: ['active', 'sold'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ])
      const byId = new Map(counts.map((c) => [String(c._id), c.count]))
      return Response.json({
        items: categories.map((c) => ({
          ...c,
          productCount: byId.get(String(c._id)) ?? 0,
        })),
      })
    }

    return Response.json({ items: categories })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = categoryCreateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const data = parsed.data

    let slug = slugify(data.name)
    if (!slug || (await Category.exists({ slug }))) slug = uniqueSlug(data.name)

    const category = await Category.create({ ...data, slug })
    return Response.json(category.toJSON(), { status: 201 })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
