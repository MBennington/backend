import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { User } from './models';
import { ObjectId } from 'mongodb';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set, using default secret. This is not secure for production!');
}

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
  return (jwt.sign as any)(
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
    const decoded = (jwt.verify as any)(token, JWT_SECRET);
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
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
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
  role?: 'ADMIN' | 'USER';
}): Promise<AuthUser | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existingUser) {
      return null;
    }

    const hashedPassword = await hashPassword(userData.password);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'USER',
      }
    });
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      role: user.role
    };
  } catch (error) {
    console.error('Create user error:', error);
    return null;
  }
}

// Reset token functions
export async function generateResetToken(userId: string): Promise<string> {
  const token = (jwt.sign as any)(
    { userId, type: 'reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Store reset token in database
  await prisma.resetToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    }
  });
  
  return token;
}

export async function validateResetToken(token: string): Promise<{ userId: string } | null> {
  try {
    const decoded = (jwt.verify as any)(token, JWT_SECRET);
    
    if (decoded.type !== 'reset') {
      return null;
    }
    
    // Check if token exists in database and is not used
    const resetToken = await prisma.resetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    if (!resetToken) {
      return null;
    }
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

export async function markResetTokenAsUsed(token: string): Promise<void> {
  await prisma.resetToken.updateMany({
    where: { token },
    data: { used: true }
  });
}

// Session validation
export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    const decoded = (jwt.verify as any)(token, JWT_SECRET);
    
    // Check if session exists in database
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });
    
    if (!session) {
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      firstName: session.user.firstName || undefined,
      lastName: session.user.lastName || undefined,
      role: session.user.role
    };
  } catch (error) {
    return null;
  }
}