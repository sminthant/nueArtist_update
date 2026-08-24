import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PostsExpirationService } from './posts-expiration.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [PostsExpirationService],
})
export class SchedulerModule {}
