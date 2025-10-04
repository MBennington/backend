const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@areca.com' },
    update: {},
    create: {
      email: 'admin@areca.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
  })

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@areca.com' },
    update: {},
    create: {
      email: 'user@areca.com',
      username: 'testuser',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isActive: true,
      isVerified: true,
    },
  })

  // Create default configurations
  const configurations = [
    {
      key: 'payment_rate_per_kg',
      value: '50.00',
      description: 'Payment rate per kilogram for employee work records',
    },
  ]

  for (const config of configurations) {
    await prisma.configuration.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
    console.log(`⚙️ Created configuration: ${config.key}`)
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Admin user created: admin@areca.com / admin123')
  console.log('👤 Test user created: user@areca.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
