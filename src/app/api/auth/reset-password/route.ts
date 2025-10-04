import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { hashPassword, validateResetToken, markResetTokenAsUsed } from '@/lib/auth'
import { resetPasswordSchema } from '@/lib/validation'
import { authRateLimit } from '@/middleware/rateLimit'

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await req.json()
    const validatedData = resetPasswordSchema.parse(body)

    // Validate reset token
    const user = await validateResetToken(validatedData.token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Mark reset token as used
    await markResetTokenAsUsed(validatedData.token)

    // Delete all user sessions to force re-login
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Reset password error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
