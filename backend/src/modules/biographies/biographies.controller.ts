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
import { BiographiesService } from './biographies.service';
import { CreateBiographyDto, UpdateBiographyDto } from './dto/biography.dto';

@Controller('admin/biographies')
export class BiographiesController {
  constructor(private readonly biographiesService: BiographiesService) {}

  @Get()
  findAll(@Query('page') page?: string) {
    return this.biographiesService.findAll(page);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  create(
    @Body() dto: CreateBiographyDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.biographiesService.create(dto, image);
  }

  @Put(':id')
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBiographyDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.biographiesService.update(BigInt(id), dto, image);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.biographiesService.remove(BigInt(id));
  }
}
