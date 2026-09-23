import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Ensure Cloudinary is configured with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

export interface CloudinaryUploadResult {
  url: string
  secure_url: string
  public_id: string
  format: string
  width: number
  height: number
  bytes: number
}

/**
 * Upload a file buffer or base64 data URI directly to Cloudinary.
 */
export async function uploadToCloudinary(
  fileBufferOrDataUri: Buffer | string,
  options: {
    folder?: string
    transformation?: object[]
  } = {}
): Promise<CloudinaryUploadResult> {
  const folder = options.folder || 'kijiji_products'

  if (typeof fileBufferOrDataUri === 'string' && fileBufferOrDataUri.startsWith('data:')) {
    // Base64 data URI
    const res = await cloudinary.uploader.upload(fileBufferOrDataUri, {
      folder,
      resource_type: 'image',
    })
    return {
      url: res.url,
      secure_url: res.secure_url,
      public_id: res.public_id,
      format: res.format,
      width: res.width,
      height: res.height,
      bytes: res.bytes,
    }
  }

  // Buffer upload via stream
  const buffer =
    typeof fileBufferOrDataUri === 'string'
      ? Buffer.from(fileBufferOrDataUri)
      : fileBufferOrDataUri

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload to Cloudinary failed'))
        } else {
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          })
        }
      }
    )

    uploadStream.end(buffer)
  })
}
