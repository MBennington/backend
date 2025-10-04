import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { createWorkRecordSchema } from '@/lib/validation'
import { workRecordRateLimit } from '@/middleware/rateLimit'
import { authenticateToken } from '@/middleware/auth'

// GET /api/work-records - Get work records for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = workRecordRateLimit(req)
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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      createdBy: userId,
    }

    // Add employee filter
    if (employeeId) {
      where.employeeId = employeeId
    }

    // Add date filter
    if (date) {
      // Ensure we're working with UTC dates to avoid timezone issues
      const startDate = new Date(date + 'T00:00:00.000Z')
      const endDate = new Date(date + 'T23:59:59.999Z')
      
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    // Get work records with pagination
    const [workRecords, total] = await Promise.all([
      prisma.workRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.workRecord.count({ where }),
    ])

    return NextResponse.json({
      workRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get work records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work records' },
      { status: 500 }
    )
  }
}

// POST /api/work-records - Create a new work record
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = workRecordRateLimit(req)
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
    const validatedData = createWorkRecordSchema.parse(body)

    // Verify employee belongs to user
    const employee = await prisma.employee.findFirst({
      where: {
        id: validatedData.employeeId,
        createdBy: userId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Convert date string to proper Date object
    let recordDate: Date;
    if (validatedData.date.includes('T')) {
      // Full datetime string
      recordDate = new Date(validatedData.date);
    } else {
      // YYYY-MM-DD format - set to start of day
      recordDate = new Date(validatedData.date + 'T00:00:00.000Z');
    }

    // Create work record
    const workRecord = await prisma.workRecord.create({
      data: {
        employeeId: validatedData.employeeId,
        date: recordDate,
        kilograms: validatedData.kilograms,
        notes: validatedData.notes,
        createdBy: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Work record created successfully',
        workRecord,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create work record error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create work record' },
      { status: 500 }
    )
  }
}
