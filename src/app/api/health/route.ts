import { NextRequest, NextResponse } from 'next/server'
import { testAllConnections, checkEnvironmentVariables } from '@/lib/connectivity'

export async function GET(req: NextRequest) {
  try {
    console.log('🏥 Health check requested')
    
    // Check environment variables
    const envCheck = checkEnvironmentVariables()
    if (!envCheck.valid) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required environment variables',
          missing: envCheck.missing,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
    
    // Test all connections
    const connectivity = await testAllConnections()
    
    const allConnected = connectivity.mongodb.connected && connectivity.cloudinary.connected
    
    return NextResponse.json(
      {
        status: allConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          mongodb: {
            status: connectivity.mongodb.connected ? 'up' : 'down',
            responseTime: connectivity.mongodb.responseTime,
            error: connectivity.mongodb.error
          },
          cloudinary: {
            status: connectivity.cloudinary.connected ? 'up' : 'down',
            responseTime: connectivity.cloudinary.responseTime,
            error: connectivity.cloudinary.error
          }
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT,
          hasJwtSecret: !!process.env.JWT_SECRET,
          hasCloudinaryConfig: !!(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
          ),
          hasEmailConfig: !!(
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS
          )
        }
      },
      { status: allConnected ? 200 : 503 }
    )
  } catch (error: any) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
