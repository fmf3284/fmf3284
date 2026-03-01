import { prisma } from '../db/prisma';
import bcrypt from 'bcryptjs';
import { sanitizeText } from '../utils/sanitize';

export interface CreateUserInput {
  email: string;
  name?: string;
  password?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

export class UsersService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a new user with hashed password
   */
  static async createUser(data: CreateUserInput) {
    const hashedPassword = data.password ? await this.hashPassword(data.password) : undefined;

    // Sanitize user input to prevent XSS
    const sanitizedEmail = sanitizeText(data.email);
    const sanitizedName = data.name ? sanitizeText(data.name) : undefined;

    return prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update user (with password hashing if password is provided)
   */
  static async updateUser(userId: string, data: UpdateUserInput) {
    const updateData: any = {};

    // Sanitize and update fields as needed
    if (data.email) {
      updateData.email = sanitizeText(data.email);
    }
    if (data.name) {
      updateData.name = sanitizeText(data.name);
    }

    // Hash password if provided
    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
