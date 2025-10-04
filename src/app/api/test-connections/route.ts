import { NextRequest, NextResponse } from 'next/server'
import { testAllConnections } from '@/lib/connectivity'

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Running connection tests...')
    
    const connectivity = await testAllConnections()
    
    const allConnected = connectivity.mongodb.connected && connectivity.cloudinary.connected
    
    return NextResponse.json(
      {
        success: allConnected,
        message: allConnected 
          ? 'All connections successful!' 
          : 'Some connections failed',
        results: connectivity,
        timestamp: new Date().toISOString()
      },
      { status: allConnected ? 200 : 503 }
    )
  } catch (error: any) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
