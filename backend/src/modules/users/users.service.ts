import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async create(data: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        passwordHash: data.passwordHash,
      },
    });
  }

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }
}
