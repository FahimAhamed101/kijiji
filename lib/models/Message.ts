import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/**
 * Inbound "Send message" enquiry submitted from a listing detail page.
 * Surfaces in the admin panel inbox.
 */
export const MESSAGE_STATUS = ['unread', 'read', 'replied', 'archived'] as const

const messageSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    productTitle: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    body: { type: String, required: true },
    status: { type: String, enum: MESSAGE_STATUS, default: 'unread', index: true },
  },
  { timestamps: true }
)

messageSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.__v
    return ret
  },
})

export type MessageDoc = InferSchemaType<typeof messageSchema>

export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) || model<MessageDoc>('Message', messageSchema)

export default Message
