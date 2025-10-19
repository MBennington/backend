import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/auth'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { changePasswordSchema } from '@/lib/validation'
import { authRateLimit } from '@/middleware/rateLimit'

async function changePassword(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const user = (req as any).user
    const body = await req.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get current user with password
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      currentUser.password
    )

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    // Delete all user sessions to force re-login
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json(
      { message: 'Password changed successfully. Please log in again.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Change password error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(changePassword)
