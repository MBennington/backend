import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Fallback authentication for development when backend API is not available
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
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Fallback login attempt:', { email, password: '***' });

    // Simple fallback authentication for development
    // In production, this should be replaced with proper authentication
    const validCredentials = [
      { email: 'admin@areca.com', password: 'admin123', user: { id: '1', email: 'admin@areca.com', username: 'admin', firstName: 'Admin', lastName: 'User', role: 'admin' } },
      { email: 'user@areca.com', password: 'user123', user: { id: '2', email: 'user@areca.com', username: 'user', firstName: 'John', lastName: 'Doe', role: 'user' } },
      { email: 'demo@areca.com', password: 'demo123', user: { id: '3', email: 'demo@areca.com', username: 'demo', firstName: 'Demo', lastName: 'User', role: 'user' } }
    ];

    // Trim and normalize email
    const normalizedEmail = email.trim().toLowerCase();
    const credential = validCredentials.find(cred => 
      cred.email.toLowerCase() === normalizedEmail && cred.password === password
    );
    
    if (!credential) {
      console.log('Invalid credentials:', { email: normalizedEmail, password: '***' });
      return NextResponse.json(
        { error: 'Invalid email or password. Try: admin@areca.com / admin123' },
        { status: 401 }
      );
    }

    console.log('Valid credentials found for:', credential.user.email);

    // Generate a simple token (in production, use proper JWT)
    const token = `fallback-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Set authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Store user data in a simple way (in production, use proper session management)
    cookieStore.set('user-data', JSON.stringify(credential.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Return success response instead of redirect for better debugging
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: credential.user,
      token: token
    });
  } catch (error) {
    console.error('Fallback login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
