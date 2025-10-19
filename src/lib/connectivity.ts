import { prisma } from './prisma'
import { cloudinary } from './cloudinary'

export interface ConnectivityStatus {
  mongodb: {
    connected: boolean
    error?: string
    responseTime?: number
  }
  cloudinary: {
    connected: boolean
    error?: string
    responseTime?: number
  }
}

export const testMongoDBConnection = async (): Promise<{ connected: boolean; error?: string; responseTime?: number }> => {
  const startTime = Date.now()
  
  try {
    // Test basic connection
    await prisma.$connect()
    
    // Test a simple query that works with MongoDB
    // Use a query that will work even with empty database
    const userCount = await prisma.user.count()
    
    const responseTime = Date.now() - startTime
    
    return {
      connected: true,
      responseTime
    }
  } catch (error: any) {
    // Handle specific MongoDB errors
    if (error.message?.includes('empty database name not allowed')) {
      return {
        connected: false,
        error: 'MongoDB connection string is missing database name. Please check DATABASE_URL in .env file.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connection refused')) {
      return {
        connected: false,
        error: 'MongoDB server is not running. Please start MongoDB or use MongoDB Atlas.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('authentication failed') || error.message?.includes('Authentication failed')) {
      return {
        connected: false,
        error: 'MongoDB authentication failed. Please check your MongoDB Atlas credentials in DATABASE_URL.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('network error') || error.message?.includes('ENOTFOUND')) {
      return {
        connected: false,
        error: 'MongoDB Atlas network error. Please check your internet connection and MongoDB Atlas cluster status.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return {
        connected: false,
        error: 'MongoDB connection timeout. Please check your MongoDB Atlas cluster and network connection.',
        responseTime: Date.now() - startTime
      }
    }
    
    return {
      connected: false,
      error: error.message || 'Unknown MongoDB connection error',
      responseTime: Date.now() - startTime
    }
  }
}

export const testCloudinaryConnection = async (): Promise<{ connected: boolean; error?: string; responseTime?: number }> => {
  const startTime = Date.now()
  
  try {
    // Test Cloudinary configuration by checking if credentials are set
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    
    if (!cloudName || !apiKey || !apiSecret) {
      return {
        connected: false,
        error: 'Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file.',
        responseTime: Date.now() - startTime
      }
    }
    
    // Check if credentials are placeholder values
    if (cloudName === 'your-cloudinary-cloud-name' || 
        apiKey === 'your-cloudinary-api-key' || 
        apiSecret === 'your-cloudinary-api-secret') {
      return {
        connected: false,
        error: 'Cloudinary credentials are placeholder values. Please update .env file with your actual Cloudinary credentials.',
        responseTime: Date.now() - startTime
      }
    }
    
    // Test Cloudinary configuration by attempting to get account info
    const result = await cloudinary.api.ping()
    
    const responseTime = Date.now() - startTime
    
    return {
      connected: true,
      responseTime
    }
  } catch (error: any) {
    // Handle specific Cloudinary errors
    if (error.message?.includes('Invalid cloud name') || error.message?.includes('Cloud not found')) {
      return {
        connected: false,
        error: 'Invalid Cloudinary cloud name. Please check CLOUDINARY_CLOUD_NAME in .env file.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('Invalid API key') || error.message?.includes('Invalid key')) {
      return {
        connected: false,
        error: 'Invalid Cloudinary API key. Please check CLOUDINARY_API_KEY in .env file.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('Invalid API secret') || error.message?.includes('Invalid secret')) {
      return {
        connected: false,
        error: 'Invalid Cloudinary API secret. Please check CLOUDINARY_API_SECRET in .env file.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return {
        connected: false,
        error: 'Cloudinary connection timeout. Please check your internet connection and Cloudinary service status.',
        responseTime: Date.now() - startTime
      }
    }
    
    if (error.message?.includes('network error') || error.message?.includes('ENOTFOUND')) {
      return {
        connected: false,
        error: 'Cloudinary network error. Please check your internet connection and Cloudinary service status.',
        responseTime: Date.now() - startTime
      }
    }
    
    return {
      connected: false,
      error: error.message || 'Unknown Cloudinary connection error',
      responseTime: Date.now() - startTime
    }
  }
}

export const testAllConnections = async (): Promise<ConnectivityStatus> => {
  console.log('🔍 Testing connectivity...\n')
  
  // Test MongoDB
  console.log('📊 Testing MongoDB connection...')
  const mongodbStatus = await testMongoDBConnection()
  
  if (mongodbStatus.connected) {
    console.log(`✅ MongoDB connected successfully (${mongodbStatus.responseTime}ms)`)
  } else {
    console.log(`❌ MongoDB connection failed: ${mongodbStatus.error}`)
  }
  
  // Test Cloudinary
  console.log('☁️  Testing Cloudinary connection...')
  const cloudinaryStatus = await testCloudinaryConnection()
  
  if (cloudinaryStatus.connected) {
    console.log(`✅ Cloudinary connected successfully (${cloudinaryStatus.responseTime}ms)`)
  } else {
    console.log(`❌ Cloudinary connection failed: ${cloudinaryStatus.error}`)
  }
  
  console.log('\n' + '='.repeat(50))
  
  return {
    mongodb: mongodbStatus,
    cloudinary: cloudinaryStatus
  }
}

export const checkEnvironmentVariables = (): { valid: boolean; missing: string[] } => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  return {
    valid: missing.length === 0,
    missing
  }
}
