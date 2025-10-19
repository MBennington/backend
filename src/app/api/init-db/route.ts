import { NextRequest, NextResponse } from 'next/server';
import { initializeRemoteDatabase } from '../../../lib/init-remote-db';
import { createErrorResponse, createAuthResponse } from '../../../lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper authorization
    if (process.env.NODE_ENV === 'production') {
      return createErrorResponse('Database initialization not allowed in production', 403);
    }

    await initializeRemoteDatabase();
    
    return createAuthResponse({ 
      message: 'Database initialized successfully',
      users: [
        { email: 'admin@areca.com', password: 'admin123', role: 'admin' },
        { email: 'user@areca.com', password: 'user123', role: 'user' },
        { email: 'demo@areca.com', password: 'demo123', role: 'user' }
      ]
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return createErrorResponse('Failed to initialize database', 500);
  }
}
