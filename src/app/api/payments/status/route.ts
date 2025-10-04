import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { authenticateToken } from '@/middleware/auth';
import { addCorsHeaders, corsMiddleware } from '@/middleware/cors';

// GET /api/payments/status - Get payment status for all employees
export async function GET(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }));
  }
  const userId = authResult.userId;

  try {
    // Get all employees for the user
    const employees = await prisma.employee.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get all work records for payment calculation
    const allWorkRecords = await prisma.workRecord.findMany({
      where: {
        createdBy: userId,
      },
      select: {
        id: true,
        employeeId: true,
        kilograms: true,
        date: true,
        createdAt: true,
      },
    });

    // Get payment status for each employee
    const paymentStatus = await Promise.all(
      employees.map(async (employee) => {
        // Get all work records for this employee
        const employeeWorkRecords = allWorkRecords.filter(record => record.employeeId === employee.id);

        // Get the latest payment record
        const latestPayment = await prisma.payment.findFirst({
          where: {
            employeeId: employee.id,
            createdBy: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Calculate payment for records after the last payment
        let pendingKilograms = 0;
        let hasNewRecordsAfterPayment = false;
        
        if (latestPayment && latestPayment.paidAt) {
          // Only calculate payment for records added after the last payment
          const paymentDate = new Date(latestPayment.paidAt);
          const recordsAfterPayment = employeeWorkRecords.filter(record => {
            const recordDate = new Date(record.createdAt);
            return recordDate > paymentDate;
          });
          pendingKilograms = recordsAfterPayment.reduce((sum, record) => sum + record.kilograms, 0);
          hasNewRecordsAfterPayment = recordsAfterPayment.length > 0;
        } else if (employeeWorkRecords.length > 0) {
          // No payment record exists, so all records are pending
          pendingKilograms = employeeWorkRecords.reduce((sum, record) => sum + record.kilograms, 0);
          hasNewRecordsAfterPayment = true;
        }

        return {
          employeeId: employee.id,
          employeeName: employee.name,
          hasPayment: !!latestPayment,
          paymentStatus: latestPayment?.status || 'NONE',
          lastPaymentDate: latestPayment?.createdAt,
          paidAt: latestPayment?.paidAt,
          totalKilograms: employeeWorkRecords.reduce((sum, record) => sum + record.kilograms, 0),
          pendingKilograms,
          hasNewRecordsAfterPayment,
        };
      })
    );

    const response = NextResponse.json({ paymentStatus }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 }));
  }
}

// POST /api/payments/status - Mark employee as paid
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

    // Create payment record with PAID status
    const payment = await prisma.payment.create({
      data: {
        employeeId,
        amount: parseFloat(amount),
        status: 'PAID',
        paidAt: new Date(),
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

    const response = NextResponse.json({ message: 'Employee marked as paid', payment }, { status: 201 });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Mark as paid error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 }));
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  return corsResponse || new NextResponse(null, { status: 200 });
}
