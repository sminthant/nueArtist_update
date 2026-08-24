import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [MediaModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
