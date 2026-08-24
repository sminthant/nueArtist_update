import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventsService } from './events.service';

@Controller('admin/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(
    @Query('filter') filter?: string,
    @Query('page') page?: string,
  ) {
    return this.eventsService.findAll(filter, page);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('poster_image', {
      storage: memoryStorage(),
    }),
  )
  create(
    @Body() dto: CreateEventDto,
    @UploadedFile() posterImage?: Express.Multer.File,
  ) {
    return this.eventsService.create(dto, posterImage);
  }

  @Put(':id')
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('poster_image', {
      storage: memoryStorage(),
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @UploadedFile() posterImage?: Express.Multer.File,
  ) {
    return this.eventsService.update(BigInt(id), dto, posterImage);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(BigInt(id));
  }
}
