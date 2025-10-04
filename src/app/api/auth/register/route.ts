import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { hashPassword, generateToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'
import { authRateLimit } from '@/middleware/rateLimit'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = authRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  try {
    const formData = await req.formData()
    
    // Extract form data
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const avatarFile = formData.get('avatar') as File | null

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    const validatedData = registerSchema.parse({
      firstName,
      lastName,
      email,
      username,
      password,
    })

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Handle avatar upload if provided
    let avatarUrl: string | null = null
    if (avatarFile && avatarFile.size > 0) {
      try {
        const arrayBuffer = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: `areca/users`,
          transformation: {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            format: 'auto',
          },
        })
        
        avatarUrl = uploadResult.secure_url
      } catch (error) {
        console.error('Avatar upload error:', error)
        // Continue without avatar if upload fails
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        avatar: avatarUrl,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    })

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user,
        token,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
