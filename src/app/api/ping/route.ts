import { NextRequest, NextResponse } from 'next/server'
import { corsMiddleware, addCorsHeaders } from '@/middleware/cors'

export async function GET(req: NextRequest) {
  // Handle CORS
  const corsResponse = corsMiddleware(req)
  if (corsResponse) return corsResponse

  const response = NextResponse.json(
    {
      message: 'Pong! Server is running',
      timestamp: new Date().toISOString(),
      status: 'ok'
    },
    { status: 200 }
  )

  return addCorsHeaders(response)
}

export async function OPTIONS(req: NextRequest) {
  const corsResponse = corsMiddleware(req);
  return corsResponse || new NextResponse(null, { status: 200 });
}
