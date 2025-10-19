import { getDatabase } from './database';
import { hashPassword } from './auth';

export async function initializeRemoteDatabase() {
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

    // Create demo users for testing
    const demoUsers = [
      { email: 'user@areca.com', username: 'user', password: 'user123', firstName: 'Demo', lastName: 'User' },
      { email: 'demo@areca.com', username: 'demo', password: 'demo123', firstName: 'Demo', lastName: 'User' }
    ];

    for (const userData of demoUsers) {
      const userExists = await db.collection('users').findOne({ email: userData.email });
      if (!userExists) {
        const hashedPassword = await hashPassword(userData.password);
        await db.collection('users').insertOne({
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Demo user created: ${userData.email} / ${userData.password}`);
      }
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

    // Create sample data for testing
    const sampleEmployees = [
      { name: 'John Doe', specialNotes: 'Senior employee' },
      { name: 'Jane Smith', specialNotes: 'Part-time worker' },
      { name: 'Mike Johnson', specialNotes: 'New employee' }
    ];

    for (const employee of sampleEmployees) {
      const employeeExists = await db.collection('employees').findOne({ name: employee.name });
      if (!employeeExists) {
        await db.collection('employees').insertOne({
          name: employee.name,
          specialNotes: employee.specialNotes,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Sample employee created: ${employee.name}`);
      }
    }

    console.log('Remote database initialized successfully');
  } catch (error) {
    console.error('Remote database initialization error:', error);
    throw error;
  }
}
