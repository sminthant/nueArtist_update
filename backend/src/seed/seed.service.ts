import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('NODE_ENV') === 'test') {
      return;
    }

    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@example.com',
    );
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      return;
    }

    const password = this.configService.get<string>('ADMIN_PASSWORD', 'password');
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.create({
      data: {
        name: this.configService.get<string>('ADMIN_NAME', 'Admin User'),
        email,
        password: hashedPassword,
        role: this.configService.get<string>('ADMIN_ROLE', 'admin'),
        emailVerifiedAt: new Date(),
      },
    });

    this.logger.log(`Seeded admin user ${email}.`);
  }
}
