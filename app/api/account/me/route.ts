import dbConnect from '@/lib/mongodb'
import Member from '@/lib/models/Member'
import { getMemberSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Current storefront member.
 *
 * Re-reads from the database rather than trusting the JWT claims, so a rename
 * or an admin disabling the account takes effect immediately instead of
 * lingering for the 30-day life of the token.
 */
export async function GET() {
  const session = await getMemberSession()
  if (!session) return Response.json({ member: null }, { status: 200 })

  try {
    await dbConnect()
    const member = await Member.findById(session.id)
    if (!member || !member.active) return Response.json({ member: null }, { status: 200 })

    return Response.json({
      member: {
        id: String(member._id),
        name: member.name,
        email: member.email,
        phone: member.phone,
        location: member.location,
        avatarColor: member.avatarColor,
        createdAt: member.createdAt,
      },
    })
  } catch {
    // A database blip shouldn't sign the customer out of the UI.
    return Response.json({ member: session }, { status: 200 })
  }
}
