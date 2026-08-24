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
import { AlbumsService } from './albums.service';
import {
  CreateAlbumDto,
  ReorderAlbumsDto,
  UpdateAlbumDto,
} from './dto/album.dto';

@Controller('admin/albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get()
  findAll(@Query('page') page?: string) {
    return this.albumsService.findAll(page);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderAlbumsDto) {
    return this.albumsService.reorder(dto);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('cover_image', {
      storage: memoryStorage(),
    }),
  )
  create(
    @Body() dto: CreateAlbumDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    return this.albumsService.create(dto, coverImage);
  }

  @Put(':id')
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('cover_image', {
      storage: memoryStorage(),
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlbumDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    return this.albumsService.update(BigInt(id), dto, coverImage);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.albumsService.remove(BigInt(id));
  }
}
