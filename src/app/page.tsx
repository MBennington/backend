import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              ARECA
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Authentication Backend with Cloudinary Integration
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">
                Authentication
              </h3>
              <p className="text-blue-700">
                Secure user registration, login, password reset, and session management
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-900 mb-3">
                ☁️ Cloudinary
              </h3>
              <p className="text-green-700">
                Image upload, optimization, and management for user avatars
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-900 mb-3">
                🛡️ Security
              </h3>
              <p className="text-purple-700">
                Rate limiting, JWT tokens, password hashing, and input validation
              </p>
            </div>

            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-orange-900 mb-3">
                📊 Database
              </h3>
              <p className="text-orange-700">
                PostgreSQL with Prisma ORM for robust data management
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              API Endpoints
            </h2>
            
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-900 mb-2">System Health</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>GET /api/health - System health check</li>
                <li>GET /api/test-connections - Test MongoDB & Cloudinary</li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Authentication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>POST /api/auth/register</li>
                  <li>POST /api/auth/login</li>
                  <li>POST /api/auth/logout</li>
                  <li>GET /api/auth/me</li>
                  <li>POST /api/auth/forgot-password</li>
                  <li>POST /api/auth/reset-password</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">User Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>GET /api/user/profile</li>
                  <li>PUT /api/user/profile</li>
                  <li>POST /api/user/avatar</li>
                  <li>DELETE /api/user/avatar</li>
                  <li>POST /api/user/change-password</li>
                  <li>POST /api/user/delete-account</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-yellow-50 rounded-xl">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              🚀 Getting Started
            </h3>
            <p className="text-yellow-800 mb-4">
              Set up your environment variables and run the database migrations:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono">
              <div>npm install</div>
              <div>npx prisma generate</div>
              <div>npx prisma db push</div>
              <div>npm run dev</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
