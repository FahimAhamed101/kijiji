'use client'

import { useState, useRef } from 'react'
import {
  UploadCloud,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Star,
  ExternalLink,
} from 'lucide-react'
import { Button, Input, Spinner } from './ui'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  folder?: string
  maxImages?: number
}

export default function ImageUploader({
  images,
  onChange,
  folder = 'kijiji_products',
  maxImages = 10,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      setUploadError('Please select valid image files (JPG, PNG, WebP).')
      return
    }

    if (images.length + fileArray.length > maxImages) {
      setUploadError(`You can upload a maximum of ${maxImages} images.`)
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const formData = new FormData()
      formData.append('folder', folder)
      fileArray.forEach((file) => {
        formData.append('file', file)
      })

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images to Cloudinary.')
      }

      const uploadedUrls: string[] = data.urls || (data.url ? [data.url] : [])
      const nextImages = [...images, ...uploadedUrls]
      onChange(nextImages)
      setUploadSuccess(`Successfully uploaded ${uploadedUrls.length} image(s) to Cloudinary!`)
      setTimeout(() => setUploadSuccess(null), 4000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  function addUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (images.includes(trimmed)) {
      setUploadError('This image URL is already added.')
      return
    }
    onChange([...images, trimmed])
    setUrlInput('')
    setUploadError(null)
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  function setAsMain(index: number) {
    if (index === 0) return
    const target = images[index]
    const remaining = images.filter((_, i) => i !== index)
    onChange([target, ...remaining])
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-brand bg-brand/5 scale-[0.99]'
            : 'border-line hover:border-brand/50 hover:bg-surface/50'
        } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </div>

        <p className="text-sm font-semibold text-ink">
          {isUploading ? (
            'Uploading to Cloudinary...'
          ) : (
            <>
              Click to upload or <span className="text-brand font-medium">drag & drop</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          PNG, JPG, WebP up to 10MB each (Stored directly in Cloudinary)
        </p>

        {isUploading && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-brand">
            <Spinner className="h-4 w-4" />
            <span>Processing and optimizing images...</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-600 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Manual URL input fallback toggle */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-brand hover:underline font-medium"
        >
          {showUrlInput ? '– Hide URL paste input' : '+ Or paste image URL directly'}
        </button>
        <span>
          {images.length} / {maxImages} images
        </span>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 animate-in fade-in duration-200">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUrl()
              }
            }}
            placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
            className="text-xs"
          />
          <Button type="button" size="sm" variant="secondary" onClick={addUrl}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted">
            The first image is your ad’s main thumbnail. Click the star to set as main.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, i) => {
              const isMain = i === 0
              const isCloudinary = url.includes('cloudinary.com')
              return (
                <li
                  key={`${url}-${i}`}
                  className={`group relative overflow-hidden rounded-lg border bg-surface transition-all ${
                    isMain ? 'border-brand ring-2 ring-brand/30' : 'border-line'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Listing photo ${i + 1}`}
                    className="h-28 w-full object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                    {isMain && (
                      <span className="flex items-center gap-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        Main
                      </span>
                    )}
                    {isCloudinary && (
                      <span className="rounded bg-sky-600/90 px-1 py-0.5 text-[9px] font-medium text-white shadow-sm">
                        Cloudinary
                      </span>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => setAsMain(i)}
                        title="Set as main thumbnail"
                        className="rounded-md bg-white p-1.5 text-xs font-medium text-ink shadow hover:bg-brand hover:text-white transition-colors"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open full image"
                      className="rounded-md bg-white p-1.5 text-xs text-ink shadow hover:bg-surface transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      title="Remove image"
                      className="rounded-md bg-white p-1.5 text-xs text-red-600 shadow hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
