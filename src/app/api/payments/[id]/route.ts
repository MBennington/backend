import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateToken } from '@/middleware/auth';
import { addCorsHeaders, corsMiddleware } from '@/middleware/cors';

// GET /api/payments/[id] - Get a specific payment
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }));
  }
  const userId = authResult.userId;
  const { id } = await params;

  try {
    const payment = await prisma.payment.findFirst({
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
    });

    if (!payment) {
      return addCorsHeaders(NextResponse.json({ error: 'Payment not found' }, { status: 404 }));
    }

    const response = NextResponse.json({ payment }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 }));
  }
}

// PUT /api/payments/[id] - Update payment status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }));
  }
  const userId = authResult.userId;
  const { id } = await params;

  try {
    const body = await req.json();
    const { status, notes } = body;

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    });

    if (!existingPayment) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      );
    }

    // Update payment status
    const updateData: any = {
      status,
      ...(notes !== undefined && { notes }),
    };

    // Set paidAt timestamp if marking as paid
    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    const payment = await prisma.payment.update({
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
    });

    const response = NextResponse.json({ message: 'Payment updated successfully', payment }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Update payment error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to update payment' }, { status: 500 }));
  }
}

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const corsResponse = corsMiddleware(req);
  if (corsResponse) return corsResponse;

  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }));
  }
  const userId = authResult.userId;
  const { id } = await params;

  try {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    });

    if (!existingPayment) {
      return addCorsHeaders(NextResponse.json({ error: 'Payment not found' }, { status: 404 }));
    }

    await prisma.payment.delete({
      where: { id },
    });

    const response = NextResponse.json({ message: 'Payment deleted successfully' }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Delete payment error:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 }));
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  return corsResponse || new NextResponse(null, { status: 200 });
}
