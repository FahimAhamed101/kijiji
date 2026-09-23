import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { jsonError, errorMessage } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return jsonError('Unauthorized. Please sign in to upload images.', 401)
    }

    const contentType = req.headers.get('content-type') || ''

    // Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const files = formData.getAll('file') as File[]
      const folder = (formData.get('folder') as string) || 'kijiji_products'

      // Also support field name 'images' or 'files'
      const allFiles: File[] = [
        ...files,
        ...(formData.getAll('images') as File[]),
        ...(formData.getAll('files') as File[]),
      ].filter((f) => f && typeof f.size === 'number' && f.size > 0)

      if (allFiles.length === 0) {
        return jsonError('No image file provided in request', 400)
      }

      const uploadResults = []

      for (const file of allFiles) {
        if (file.size > MAX_FILE_SIZE) {
          return jsonError(`File "${file.name}" exceeds the 10MB limit.`, 400)
        }

        if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
          return jsonError(
            `File "${file.name}" has unsupported format (${file.type}). Allowed: JPG, PNG, WEBP, GIF, AVIF.`,
            400
          )
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const uploaded = await uploadToCloudinary(buffer, { folder })
        uploadResults.push(uploaded)
      }

      return NextResponse.json({
        success: true,
        url: uploadResults[0].secure_url,
        urls: uploadResults.map((r) => r.secure_url),
        results: uploadResults,
      })
    }

    // Handle JSON payload (e.g. Base64 data URI)
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null)
      if (!body) return jsonError('Invalid JSON payload', 400)

      const fileData = body.file || body.image || body.dataUri
      const folder = body.folder || 'kijiji_products'

      if (!fileData || typeof fileData !== 'string') {
        return jsonError('No image data found in JSON payload', 400)
      }

      const uploaded = await uploadToCloudinary(fileData, { folder })
      return NextResponse.json({
        success: true,
        url: uploaded.secure_url,
        urls: [uploaded.secure_url],
        result: uploaded,
      })
    }

    return jsonError('Unsupported Content-Type. Expected multipart/form-data or application/json.', 415)
  } catch (err) {
    return jsonError(errorMessage(err), 500)
  }
}
