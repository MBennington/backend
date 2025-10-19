import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (token) {
      // Call your backend API for logout
      try {
        await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Backend logout error:', error);
        // Continue with local logout even if backend call fails
      }
    }

    // Clear authentication cookie
    cookieStore.delete('auth-token');

    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}