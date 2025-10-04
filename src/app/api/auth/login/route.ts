import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { verifyPassword, generateToken, createSession } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { authRateLimit } from '@/middleware/rateLimit'

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const body = await req.json()
    const validatedData = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(validatedData.password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = await createSession(user.id)

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    // Return user data (excluding password)
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'Login successful',
        user: userWithoutPassword,
        token,
        sessionToken,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
