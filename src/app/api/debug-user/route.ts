import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      user,
      userId: user.id,
      userIdType: typeof user.id,
      userIdLength: user.id ? user.id.length : 0,
      isObjectId: user.id && typeof user.id === 'string' && user.id.length === 24
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
