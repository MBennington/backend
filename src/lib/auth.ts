import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './database'
import { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: string
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

export const createSession = async (userId: string): Promise<string> => {
  const token = generateToken({ id: userId, email: '', username: '', role: 'USER' })
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export const deleteSession = async (token: string): Promise<void> => {
  await prisma.session.deleteMany({
    where: { token },
  })
}

export const validateSession = async (token: string): Promise<User | null> => {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

export const generateResetToken = async (userId: string): Promise<string> => {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15)
  
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

  await prisma.resetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export const validateResetToken = async (token: string): Promise<User | null> => {
  const resetToken = await prisma.resetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetToken || resetToken.expiresAt < new Date() || resetToken.used) {
    return null
  }

  return resetToken.user
}

export const markResetTokenAsUsed = async (token: string): Promise<void> => {
  await prisma.resetToken.update({
    where: { token },
    data: { used: true },
  })
}
