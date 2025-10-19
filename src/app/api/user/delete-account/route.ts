import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'
import { verifyPassword } from '@/lib/auth'
import { authRateLimit } from '@/middleware/rateLimit'

async function deleteAccount(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const user = (req as any).user
    const body = await req.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      )
    }

    // Get current user with password
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, avatar: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, currentUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 400 }
      )
    }

    // Delete user (this will cascade delete sessions and reset tokens)
    await prisma.user.delete({
      where: { id: user.id },
    })

    // Note: Avatar deletion from Cloudinary would be handled by a cleanup job
    // or you could add it here if needed

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(deleteAccount)
