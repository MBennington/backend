#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ARECA Authentication Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please update the values with your configuration.\n');
  } else {
    console.log('❌ .env.example file not found. Please create your .env file manually.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully.\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Generate Prisma client
console.log('🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully.\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  console.log('💡 Make sure your DATABASE_URL is correctly set in .env file.\n');
}

// Push database schema
console.log('🗄️  Setting up database schema...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema created successfully.\n');
} catch (error) {
  console.error('❌ Failed to set up database schema:', error.message);
  console.log('💡 Make sure your database is running and DATABASE_URL is correct.\n');
}

console.log('🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update your .env file with your actual configuration values');
console.log('2. Make sure your PostgreSQL database is running');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Visit http://localhost:3000 to see the API documentation');
console.log('\n🔗 Useful commands:');
console.log('- npm run dev          # Start development server');
console.log('- npx prisma studio    # Open database GUI');
console.log('- npx prisma migrate   # Run database migrations');
console.log('- npm run build         # Build for production');
