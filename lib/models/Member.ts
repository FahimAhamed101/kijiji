import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/**
 * A public site member — the people who browse, buy and sell on the
 * marketplace.
 *
 * Deliberately a separate collection from `User`. `User` holds *staff* accounts
 * (admin / editor / moderator) that sign in to the admin panel and are gated by
 * role; members are untrusted, self-registered and have no panel access at all.
 * Keeping them apart means a member can never inherit a staff role, and the
 * admin staff list stays free of customer noise.
 */
const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // bcrypt hash - never the plain password. `select: false` so it never rides
    // along on an ordinary query.
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, default: '', trim: true, maxlength: 40 },
    // Free-text "City, Province" — matches how listings store `location`.
    location: { type: String, default: '', trim: true, maxlength: 120 },
    avatarColor: { type: String, default: '#0074f8' },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
)

memberSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.passwordHash
    return ret
  },
})

export type MemberDoc = InferSchemaType<typeof memberSchema>

export const Member: Model<MemberDoc> =
  (models.Member as Model<MemberDoc>) || model<MemberDoc>('Member', memberSchema)

export default Member
