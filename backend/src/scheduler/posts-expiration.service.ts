import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsExpirationService {
  private readonly logger = new Logger(PostsExpirationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredPosts(): Promise<void> {
    try {
      const threshold = new Date(Date.now() + 5 * 60 * 1000);

      const result = await this.prisma.post.updateMany({
        where: {
          deletedAt: null,
          expireAt: {
            not: null,
            lte: threshold,
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.log(`Soft deleted ${result.count} expired post(s).`);
      }
    } catch (error) {
      this.logger.error('Failed to delete expired posts.', error);
    }
  }
}
