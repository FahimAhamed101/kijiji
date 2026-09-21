import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/lib/models/Product'
import { getSession } from '@/lib/auth'
import { productUpdateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage, asStringArray } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

/** Look a product up by ObjectId *or* slug. */
async function findProduct(id: string) {
  const query = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id }
  return Product.findOne(query)
}

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    await dbConnect()
    const product = await findProduct(params.id)
    if (!product) return jsonError('Listing not found', 404)

    // Count a view unless explicitly suppressed (e.g. admin preview).
    if (req.nextUrl.searchParams.get('noview') !== '1') {
      product.views = (product.views ?? 0) + 1
      await product.save()
    }

    const populated = await product.populate('category', 'name slug group')
    return Response.json(populated.toJSON())
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = productUpdateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const product = await findProduct(params.id)
    if (!product) return jsonError('Listing not found', 404)

    const data = parsed.data
    if (data.images) data.images = asStringArray(data.images)
    if (data.tags) data.tags = asStringArray(data.tags)

    Object.assign(product, data)
    await product.save()

    const populated = await product.populate('category', 'name slug group')
    return Response.json(populated.toJSON())
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)
    if (session.role !== 'admin') {
      return jsonError('Only admins can delete listings', 403)
    }

    await dbConnect()
    const product = await findProduct(params.id)
    if (!product) return jsonError('Listing not found', 404)

    await product.deleteOne()
    return Response.json({ ok: true, id: params.id })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
