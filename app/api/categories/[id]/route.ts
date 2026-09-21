import type { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/lib/models/Category'
import Product from '@/lib/models/Product'
import { getSession } from '@/lib/auth'
import { categoryUpdateSchema, formatZodError } from '@/lib/validators'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

async function findCategory(id: string) {
  const query = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id }
  return Category.findOne(query)
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return jsonError('Category not found', 404)
    const productCount = await Product.countDocuments({ category: category._id })
    return Response.json({ ...category.toJSON(), productCount })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    const body = await req.json().catch(() => null)
    const parsed = categoryUpdateSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodError(parsed.error), 422)

    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return jsonError('Category not found', 404)

    Object.assign(category, parsed.data)
    await category.save()
    return Response.json(category.toJSON())
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)
    if (session.role !== 'admin') {
      return jsonError('Only admins can delete categories', 403)
    }

    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return jsonError('Category not found', 404)

    const inUse = await Product.countDocuments({ category: category._id })
    if (inUse > 0) {
      return jsonError(
        `Cannot delete: ${inUse} listing(s) still use this category. Reassign them first.`,
        409
      )
    }

    await category.deleteOne()
    return Response.json({ ok: true, id: params.id })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
