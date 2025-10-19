import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser } from '../../../../lib/auth';
import { createErrorResponse } from '../../../../lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and form data
    let email, password;
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      // Handle form data
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    }

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Authenticate user with database
    const authResult = await authenticateUser(email, password);
    
    if (!authResult) {
      return createErrorResponse('Invalid email or password', 401);
    }

    const { user, token } = authResult;

    // Set authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Store user data in cookie for dashboard access
    cookieStore.set('user-data', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}