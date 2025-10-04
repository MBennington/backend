import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = (config: RateLimitConfig) => {
  return (req: NextRequest): NextResponse | null => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Clean up expired entries
    for (const key of rateLimitMap.keys()) {
      const value = rateLimitMap.get(key)
      if (value && value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }

    const key = `${ip}:${req.nextUrl.pathname}`
    const current = rateLimitMap.get(key)

    if (!current) {
      rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs })
      return null
    }

    if (current.resetTime < now) {
      rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs })
      return null
    }

    if (current.count >= config.max) {
      return NextResponse.json(
        { 
          error: config.message || 'Too many requests',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      )
    }

    current.count++
    return null
  }
}

// Predefined rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window (increased from 5)
  message: 'Too many authentication attempts, please try again later'
})

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window (increased from 100)
  message: 'Too many API requests, please try again later'
})

export const workRecordRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 work record operations per 5 minutes
  message: 'Too many work record operations, please try again later'
})

export const employeeRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 employee operations per 5 minutes
  message: 'Too many employee operations, please try again later'
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour (increased from 10)
  message: 'Upload limit exceeded, please try again later'
})
