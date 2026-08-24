import { Module } from '@nestjs/common';
import { LocalStorageDriver, MediaService } from './media.service';

@Module({
  providers: [LocalStorageDriver, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
