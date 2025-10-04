/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    
    // Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    
    // Email Configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    
    // App Configuration
    // NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    
    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    
    // File Upload Configuration
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
}

module.exports = nextConfig
