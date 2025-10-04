import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { requireAuth } from '@/middleware/auth'

async function handler(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (token) {
      await deleteSession(token)
    }

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)
