#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ARECA Backend Startup Check\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('💡 Please create .env file with your configuration.');
  process.exit(1);
}

console.log('✅ .env file found');

// Check if MongoDB is running
console.log('\n📊 Checking MongoDB connection...');
try {
  // Try to connect to MongoDB
  execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'pipe' });
  console.log('✅ MongoDB is running and accessible');
} catch (error) {
  console.log('❌ MongoDB connection failed');
  console.log('💡 Make sure MongoDB is running:');
  console.log('   - Start MongoDB service');
  console.log('   - Or run: mongod');
  console.log('   - Or use MongoDB Atlas connection string');
}

// Check if Prisma client is generated
console.log('\n🔧 Checking Prisma client...');
try {
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    console.log('✅ Prisma client is generated');
  } else {
    console.log('⚠️  Prisma client not found, generating...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  }
} catch (error) {
  console.log('❌ Failed to generate Prisma client');
  console.log('💡 Run: npx prisma generate');
}

// Check environment variables
console.log('\n🔍 Checking environment variables...');
require('dotenv').config({ path: envPath });

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length === 0) {
  console.log('✅ All required environment variables are set');
} else {
  console.log('❌ Missing environment variables:');
  missing.forEach(varName => console.log(`   - ${varName}`));
  console.log('💡 Please update your .env file with the missing variables');
}

console.log('\n🎉 Startup check completed!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Update .env file with your actual credentials');
console.log('3. Run: npm run dev');
console.log('4. Test connections: curl http://localhost:3000/api/health');
console.log('5. Test specific connections: curl http://localhost:3000/api/test-connections');
