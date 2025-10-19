import { getDatabase } from './database';
import { hashPassword } from './auth';

export async function initializeDatabase() {
  try {
    const db = await getDatabase();
    
    // Create indexes for better performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('dispatches').createIndex({ userId: 1 });
    await db.collection('dispatches').createIndex({ dispatchDate: 1 });
    await db.collection('workRecords').createIndex({ employeeId: 1 });
    await db.collection('workRecords').createIndex({ date: 1 });
    await db.collection('payments').createIndex({ employeeId: 1 });
    await db.collection('payments').createIndex({ status: 1 });

    // Create default admin user if it doesn't exist
    const adminExists = await db.collection('users').findOne({ email: 'admin@areca.com' });
    
    if (!adminExists) {
      const adminPassword = await hashPassword('admin123');
      await db.collection('users').insertOne({
        email: 'admin@areca.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Default admin user created: admin@areca.com / admin123');
    }

    // Create default configuration
    const configExists = await db.collection('configurations').findOne({ key: 'payment_rate_per_kg' });
    
    if (!configExists) {
      await db.collection('configurations').insertOne({
        key: 'payment_rate_per_kg',
        value: '50.00',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Default payment rate configuration created');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}
