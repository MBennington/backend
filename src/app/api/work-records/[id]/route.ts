import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { updateWorkRecordSchema } from '@/lib/validation'
import { workRecordRateLimit } from '@/middleware/rateLimit'
import { authenticateToken } from '@/middleware/auth'

// GET /api/work-records/[id] - Get a specific work record
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Get work record
    const workRecord = await prisma.workRecord.findFirst({
      where: {
        id,
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

    if (!workRecord) {
      return NextResponse.json(
        { error: 'Work record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ workRecord })
  } catch (error: any) {
    console.error('Get work record error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work record' },
      { status: 500 }
    )
  }
}

// PUT /api/work-records/[id] - Update a work record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateWorkRecordSchema.parse(body)

    // Check if work record exists and belongs to user
    const existingWorkRecord = await prisma.workRecord.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    })

    if (!existingWorkRecord) {
      return NextResponse.json(
        { error: 'Work record not found' },
        { status: 404 }
      )
    }

    // Convert date string to proper Date object if provided
    let updateData: any = {
      ...(validatedData.kilograms !== undefined && { kilograms: validatedData.kilograms }),
      ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
    };

    if (validatedData.date) {
      let recordDate: Date;
      if (validatedData.date.includes('T')) {
        // Full datetime string
        recordDate = new Date(validatedData.date);
      } else {
        // YYYY-MM-DD format - set to start of day
        recordDate = new Date(validatedData.date + 'T00:00:00.000Z');
      }
      updateData.date = recordDate;
    }

    // Update work record
    const workRecord = await prisma.workRecord.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Work record updated successfully',
      workRecord,
    })
  } catch (error: any) {
    console.error('Update work record error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update work record' },
      { status: 500 }
    )
  }
}

// DELETE /api/work-records/[id] - Delete a work record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Check if work record exists and belongs to user
    const existingWorkRecord = await prisma.workRecord.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    })

    if (!existingWorkRecord) {
      return NextResponse.json(
        { error: 'Work record not found' },
        { status: 404 }
      )
    }

    // Delete work record
    await prisma.workRecord.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Work record deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete work record error:', error)
    return NextResponse.json(
      { error: 'Failed to delete work record' },
      { status: 500 }
    )
  }
}
