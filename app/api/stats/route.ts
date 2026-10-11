import dbConnect from '@/lib/mongodb'
import Product from '@/lib/models/Product'
import Category from '@/lib/models/Category'
import User from '@/lib/models/User'
import Member from '@/lib/models/Member'
import Message from '@/lib/models/Message'
import Report from '@/lib/models/Report'
import Order from '@/lib/models/Order'
import { getSession } from '@/lib/auth'
import { jsonError, errorMessage } from '@/lib/api-helpers'
import { orderView, type RawOrder } from '@/lib/order-view'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return jsonError('Not authenticated', 401)

    await dbConnect()

    const [
      totalProducts,
      activeProducts,
      draftProducts,
      soldProducts,
      archivedProducts,
      featuredProducts,
      totalCategories,
      activeCategories,
      totalUsers,
      totalMessages,
      unreadMessages,
      openReports,
      totalViews,
      totalMembers,
      totalOrders,
      paidOrders,
      pendingOrders,
      revenueAgg,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'draft' }),
      Product.countDocuments({ status: 'sold' }),
      Product.countDocuments({ status: 'archived' }),
      Product.countDocuments({ featured: true }),
      Category.countDocuments(),
      Category.countDocuments({ active: true }),
      User.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ status: 'unread' }),
      Report.countDocuments({ status: 'open' }),
      Product.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: '$views' } } },
      ]).then((r) => r[0]?.total ?? 0),
      Member.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ 'payment.status': 'paid' }),
      Order.countDocuments({ status: 'pending' }),
      // Revenue counts only settled payments, never the order total of an
      // unpaid basket.
      Order.aggregate<{ total: number }>([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]).then((r) => r[0]?.total ?? 0),
    ])

    // Newest 6 listings for the dashboard activity feed.
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('category', 'name slug')
      .lean()

    // Newest orders, so the dashboard shows something is actually selling.
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean()

    // Listings per category, biggest first.
    const byCategory = await Product.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ])
    const catIds = byCategory.map((c) => c._id).filter(Boolean)
    const cats = await Category.find({ _id: { $in: catIds } }).select('name slug').lean()
    const catName = new Map(cats.map((c) => [String(c._id), c.name]))
    const categoriesBreakdown = byCategory.map((c) => ({
      name: catName.get(String(c._id)) ?? 'Uncategorised',
      count: c.count,
    }))

    return Response.json({
      products: {
        total: totalProducts,
        active: activeProducts,
        draft: draftProducts,
        sold: soldProducts,
        archived: archivedProducts,
        featured: featuredProducts,
      },
      categories: { total: totalCategories, active: activeCategories },
      users: { total: totalUsers },
      members: { total: totalMembers },
      orders: {
        total: totalOrders,
        paid: paidOrders,
        pending: pendingOrders,
        revenue: revenueAgg,
      },
      messages: { total: totalMessages, unread: unreadMessages },
      reports: { open: openReports },
      views: { total: totalViews },
      recentProducts,
      recentOrders: (recentOrders as unknown as RawOrder[]).map(orderView),
      categoriesBreakdown,
    })
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
