import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from './database';
import { User } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });
    
    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const authUser: AuthUser = {
      id: user._id!.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    const token = generateToken(authUser);
    
    return { user: authUser, token };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return null;
    }

    return {
      id: user._id!.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function createUser(userData: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user';
}): Promise<AuthUser | null> {
  try {
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection<User>('users').findOne({ email: userData.email });
    if (existingUser) {
      return null;
    }

    const hashedPassword = await hashPassword(userData.password);
    
    const user: Omit<User, '_id'> = {
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection<User>('users').insertOne(user as User);
    
    return {
      id: result.insertedId.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}