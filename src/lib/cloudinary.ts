import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

export const uploadToCloudinary = async (
  file: Buffer | string,
  options: {
    folder?: string
    transformation?: any
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
  } = {}
): Promise<CloudinaryUploadResult> => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: options.folder || 'areca/users',
      resource_type: options.resource_type || 'image',
      transformation: options.transformation,
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image from Cloudinary')
  }
}

export const getCloudinaryUrl = (
  publicId: string,
  transformations?: any
): string => {
  return cloudinary.url(publicId, transformations)
}
