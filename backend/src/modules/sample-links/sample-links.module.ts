import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { SampleLinksController } from './sample-links.controller';
import { SampleLinksService } from './sample-links.service';

@Module({
  imports: [MediaModule],
  controllers: [SampleLinksController],
  providers: [SampleLinksService],
})
export class SampleLinksModule {}
