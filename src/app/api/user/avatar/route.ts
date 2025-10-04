import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireAuth } from '@/middleware/auth'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import { uploadRateLimit } from '@/middleware/rateLimit'

async function uploadAvatar(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = uploadRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const user = (req as any).user
    const formData = await req.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: `areca/users/${user.id}`,
      transformation: {
        width: 400,
        height: 400,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
        format: 'auto',
      },
    })

    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: uploadResult.secure_url },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Delete old avatar from Cloudinary if it exists
    if (currentUser?.avatar && currentUser.avatar.includes('cloudinary.com')) {
      try {
        const publicId = currentUser.avatar.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteFromCloudinary(`areca/users/${user.id}/${publicId}`)
        }
      } catch (error) {
        console.error('Failed to delete old avatar:', error)
        // Don't fail the request if old avatar deletion fails
      }
    }

    return NextResponse.json(
      { 
        message: 'Avatar updated successfully',
        user: updatedUser,
        avatar: uploadResult.secure_url
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

async function deleteAvatar(req: NextRequest) {
  try {
    const user = (req as any).user

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    })

    // Update user to remove avatar
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Delete avatar from Cloudinary if it exists
    if (currentUser?.avatar && currentUser.avatar.includes('cloudinary.com')) {
      try {
        const publicId = currentUser.avatar.split('/').pop()?.split('.')[0]
        if (publicId) {
          await deleteFromCloudinary(`areca/users/${user.id}/${publicId}`)
        }
      } catch (error) {
        console.error('Failed to delete avatar from Cloudinary:', error)
        // Don't fail the request if Cloudinary deletion fails
      }
    }

    return NextResponse.json(
      { 
        message: 'Avatar deleted successfully',
        user: updatedUser
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Avatar deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(uploadAvatar)
export const DELETE = requireAuth(deleteAvatar)
