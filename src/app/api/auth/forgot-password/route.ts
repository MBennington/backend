import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { generateResetToken } from '@/lib/auth'
import { forgotPasswordSchema } from '@/lib/validation'
import { authRateLimit } from '@/middleware/rateLimit'
import nodemailer from 'nodemailer'

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await req.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = await generateResetToken(user.id)

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.firstName || user.username},</p>
        <p>You requested a password reset for your ARECA account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    })

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
