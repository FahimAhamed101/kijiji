import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/**
 * Admin / staff account used to sign in to the admin panel.
 * `role` drives what the panel lets you do (see lib/auth.ts).
 */
export const USER_ROLES = ['admin', 'editor', 'moderator'] as const
export type UserRole = (typeof USER_ROLES)[number]

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // bcrypt hash - never the plain password.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'editor', index: true },
    active: { type: Boolean, default: true },
    avatarColor: { type: String, default: '#2563eb' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
)

userSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.passwordHash
    return ret
  },
})

export type UserDoc = InferSchemaType<typeof userSchema>

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema)

export default User
