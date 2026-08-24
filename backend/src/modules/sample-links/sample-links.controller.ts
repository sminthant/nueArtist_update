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
import {
  CreateSampleLinkDto,
  ReorderSampleLinksDto,
  ToggleSampleLinkDto,
  UpdateSampleLinkDto,
} from './dto/sample-link.dto';
import { SampleLinksService } from './sample-links.service';

@Controller('admin/sample-links')
export class SampleLinksController {
  constructor(private readonly sampleLinksService: SampleLinksService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.sampleLinksService.findAll(search, page);
  }

  @Post('reorder')
  reorder(@Body() dto: ReorderSampleLinksDto) {
    return this.sampleLinksService.reorder(dto);
  }

  @Post(':id/toggle-active')
  toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleSampleLinkDto,
  ) {
    return this.sampleLinksService.toggleActive(BigInt(id), dto);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  create(
    @Body() dto: CreateSampleLinkDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.sampleLinksService.create(dto, image);
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
    @Body() dto: UpdateSampleLinkDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.sampleLinksService.update(BigInt(id), dto, image);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sampleLinksService.remove(BigInt(id));
  }
}
