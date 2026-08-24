import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  updateProfile(id: bigint, data: { name: string; email: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        emailVerifiedAt: null,
      },
    });
  }

  deleteUser(id: bigint): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  getAdminContactEmail(): Promise<string | null> {
    const adminRole = process.env.ADMIN_ROLE ?? 'admin';

    return this.prisma.user
      .findFirst({
        where: { role: adminRole },
        orderBy: { id: 'asc' },
        select: { email: true },
      })
      .then((user) => user?.email ?? process.env.ADMIN_EMAIL ?? null);
  }
}
