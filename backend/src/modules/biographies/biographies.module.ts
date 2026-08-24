import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { BiographiesController } from './biographies.controller';
import { BiographiesService } from './biographies.service';

@Module({
  imports: [MediaModule],
  controllers: [BiographiesController],
  providers: [BiographiesService],
})
export class BiographiesModule {}
