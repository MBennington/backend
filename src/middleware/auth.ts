import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, validateSession } from '@/lib/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    username: string
    role: string
  }
}

export const authMiddleware = async (req: NextRequest): Promise<NextResponse | null> => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // First try to validate as session token
    const user = await validateSession(token)
    if (user) {
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      }
      return null // Continue to the route handler
    }

    // If not a session token, try as JWT
    const decoded = verifyToken(token)
    if (decoded) {
      (req as AuthenticatedRequest).user = decoded
      return null // Continue to the route handler
    }

    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

export const requireAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    const authResult = await authMiddleware(req)
    if (authResult) return authResult

    return handler(req as AuthenticatedRequest)
  }
}

export const requireRole = (roles: string[]) => {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const authResult = await authMiddleware(req)
      if (authResult) return authResult

      const user = (req as AuthenticatedRequest).user
      if (!user || !roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(req as AuthenticatedRequest)
    }
  }
}

// Helper function for authentication that returns user info
export const authenticateToken = async (req: NextRequest): Promise<{ success: boolean; userId?: string; user?: any; error?: string }> => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { success: false, error: 'Authentication required' }
  }

  try {
    // First try to validate as session token
    const user = await validateSession(token)
    if (user) {
      return { 
        success: true, 
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }
      }
    }

    // If not a session token, try as JWT
    const decoded = verifyToken(token)
    if (decoded) {
      return { 
        success: true, 
        userId: decoded.id,
        user: decoded
      }
    }

    return { success: false, error: 'Invalid or expired token' }
  } catch (error) {
    return { success: false, error: 'Authentication failed' }
  }
}
