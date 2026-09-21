import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose'

/** Abuse report filed against a listing from the public site. */
export const REPORT_REASONS = [
  'spam',
  'fraud',
  'prohibited-item',
  'wrong-category',
  'duplicate',
  'other',
] as const

export const REPORT_STATUS = ['open', 'reviewing', 'resolved', 'dismissed'] as const

const reportSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    productTitle: { type: String, default: '' },
    reason: { type: String, enum: REPORT_REASONS, default: 'other' },
    details: { type: String, default: '' },
    reporterEmail: { type: String, default: '' },
    status: { type: String, enum: REPORT_STATUS, default: 'open', index: true },
  },
  { timestamps: true }
)

reportSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret.__v
    return ret
  },
})

export type ReportDoc = InferSchemaType<typeof reportSchema>

export const Report: Model<ReportDoc> =
  (models.Report as Model<ReportDoc>) || model<ReportDoc>('Report', reportSchema)

export default Report
