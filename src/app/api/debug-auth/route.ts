import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const userData = cookieStore.get('user-data')?.value;

    return NextResponse.json({
      hasToken: !!token,
      tokenType: token?.startsWith('fallback-token-') ? 'fallback' : 'api',
      hasUserData: !!userData,
      userData: userData ? JSON.parse(userData) : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
