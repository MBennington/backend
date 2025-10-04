import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { authenticateToken } from '@/middleware/auth';
import { addCorsHeaders, corsMiddleware } from '@/middleware/cors';

// GET /api/payments - Get all payments for the authenticated user
export async function GET(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }));
  }
  const userId = authResult.userId;

  try {
    const payments = await prisma.payment.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = NextResponse.json({ payments }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 }));
  }
}

// POST /api/payments - Create a new payment record
export async function POST(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }));
  }
  const userId = authResult.userId;

  try {
    const body = await req.json();
    const { employeeId, amount, notes } = body;

    // Verify employee belongs to the user
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        createdBy: userId,
      },
    });

    if (!employee) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        notes,
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
    });

    const response = NextResponse.json({ message: 'Payment created successfully', payment }, { status: 201 });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Create payment error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to create payment' }, { status: 500 }));
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  return corsResponse || new NextResponse(null, { status: 200 });
}
