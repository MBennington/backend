import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '../../../../lib/auth';
import { createErrorResponse, createAuthResponse } from '../../../../lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, firstName, lastName } = await request.json();

    // Validation
    if (!email || !username || !password) {
      return createErrorResponse('Email, username, and password are required', 400);
    }

    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters', 400);
    }

    // Create user
    const user = await createUser({
      email,
      username,
      password,
      firstName,
      lastName,
      role: 'user'
    });

    if (!user) {
      return createErrorResponse('User already exists or creation failed', 400);
    }

    return createAuthResponse({ 
      message: 'User created successfully',
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
    console.error('Registration error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}