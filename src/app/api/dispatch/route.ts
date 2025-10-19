import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/database';
import { authenticateRequest, createErrorResponse } from '@/lib/middleware';
import { Dispatch } from '@/lib/models';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Handle form data
    const formData = await request.formData();
    const dispatchedKg = parseFloat(formData.get('dispatchedKg') as string);
    const dispatchDate = formData.get('dispatchDate') as string;
    const dispatchNotes = formData.get('dispatchNotes') as string;

    // Validation
    if (!dispatchedKg || dispatchedKg <= 0) {
      return createErrorResponse('Please enter a valid dispatched amount', 400);
    }

    if (!dispatchDate) {
      return createErrorResponse('Please select a dispatch date', 400);
    }

    // Save to database
    const db = await getDatabase();
    const dispatchRecord: Omit<Dispatch, '_id'> = {
      userId: new ObjectId(user.id),
      dispatchedKg,
      dispatchDate: new Date(dispatchDate),
      dispatchNotes: dispatchNotes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection<Dispatch>('dispatches').insertOne(dispatchRecord as Dispatch);

    if (!result.insertedId) {
      return createErrorResponse('Failed to save dispatch record', 500);
    }

    // Redirect back to dashboard with success message
    return NextResponse.redirect(new URL('/dashboard?dispatch=success', request.url));
  } catch (error) {
    console.error('Dispatch error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Get dispatches for the user
    const db = await getDatabase();
    const dispatches = await db.collection<Dispatch>('dispatches')
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ dispatches });
  } catch (error) {
    console.error('Get dispatches error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
