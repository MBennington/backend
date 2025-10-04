import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { createEmployeeSchema } from '@/lib/validation'
import { employeeRateLimit } from '@/middleware/rateLimit'
import { authenticateToken } from '@/middleware/auth'

// GET /api/employees - Get all employees for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = employeeRateLimit(req)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const authResult = await authenticateToken(req)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = authResult

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      createdBy: userId,
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialNotes: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Add active filter
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Get employees with pagination
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          specialNotes: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.employee.count({ where }),
    ])

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Create a new employee
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = employeeRateLimit(req)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const authResult = await authenticateToken(req)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = authResult

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = createEmployeeSchema.parse(body)

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        name: validatedData.name,
        specialNotes: validatedData.specialNotes,
        createdBy: userId,
      },
      select: {
        id: true,
        name: true,
        specialNotes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Employee created successfully',
        employee,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create employee error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
