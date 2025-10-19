import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export async function authenticateRequest(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return { user: null, error: 'No authentication token provided' };
    }

    const user = verifyToken(token);
    if (!user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    return { user };
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export function createAuthResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}
