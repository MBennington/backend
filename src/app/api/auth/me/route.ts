import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createAuthResponse } from '../../../../lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    return createAuthResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}