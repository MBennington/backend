import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateToken } from '@/middleware/auth'
import { addCorsHeaders, corsMiddleware } from '@/middleware/cors'

export async function GET(req: NextRequest) {
  const corsResponse = corsMiddleware(req)
  if (corsResponse) return corsResponse

  const authResult = await authenticateToken(req)
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }))
  }

  try {
    const configurations = await prisma.configuration.findMany({
      orderBy: {
        key: 'asc',
      },
    })

    const response = NextResponse.json({ configurations }, { status: 200 })
    return addCorsHeaders(response)
  } catch (error) {
    console.error('Error fetching configurations:', error)
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 }))
  }
}

export async function PUT(req: NextRequest) {
  const corsResponse = corsMiddleware(req)
  if (corsResponse) return corsResponse

  const authResult = await authenticateToken(req)
  if (!authResult.success) {
    return addCorsHeaders(NextResponse.json({ error: authResult.error }, { status: 401 }))
  }

  try {
    const body = await req.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Key and value are required' },
          { status: 400 }
        )
      )
    }

    // Validate payment rate if it's the payment_rate_per_kg key
    if (key === 'payment_rate_per_kg') {
      const rate = parseFloat(value)
      if (isNaN(rate) || rate < 0) {
        return addCorsHeaders(
          NextResponse.json(
            { error: 'Payment rate must be a valid positive number' },
            { status: 400 }
          )
        )
      }
    }

    // Update or create configuration
    const configuration = await prisma.configuration.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        description: getConfigurationDescription(key),
      },
    })

    const response = NextResponse.json(
      { message: 'Configuration updated successfully', configuration },
      { status: 200 }
    )
    return addCorsHeaders(response)
  } catch (error: any) {
    console.error('Update configuration error:', error)
    return addCorsHeaders(NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 }))
  }
}

export async function OPTIONS(req: NextRequest) {
  const corsResponse = corsMiddleware(req)
  return corsResponse || new NextResponse(null, { status: 200 })
}

// Helper function to get configuration descriptions
function getConfigurationDescription(key: string): string {
  const descriptions: { [key: string]: string } = {
    payment_rate_per_kg: 'Payment rate per kilogram for employee work records',
  }
  
  return descriptions[key] || 'System configuration setting'
}
