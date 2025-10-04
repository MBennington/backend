import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { updateEmployeeSchema } from '@/lib/validation'
import { employeeRateLimit } from '@/middleware/rateLimit'
import { authenticateToken } from '@/middleware/auth'

// GET /api/employees/[id] - Get a specific employee
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params

    // Get employee
    const employee = await prisma.employee.findFirst({
      where: {
        id,
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

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ employee })
  } catch (error: any) {
    console.error('Get employee error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Update an employee
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params

    // Parse and validate request body
    const body = await req.json()
    const validatedData = updateEmployeeSchema.parse(body)

    // Check if employee exists and belongs to user
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.specialNotes !== undefined && { specialNotes: validatedData.specialNotes }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
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

    return NextResponse.json({
      message: 'Employee updated successfully',
      employee,
    })
  } catch (error: any) {
    console.error('Update employee error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Delete an employee
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params

    // Check if employee exists and belongs to user
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Delete employee
    await prisma.employee.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Employee deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
