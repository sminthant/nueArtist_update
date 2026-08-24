import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [UsersModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
