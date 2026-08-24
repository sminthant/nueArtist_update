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
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostsService } from './posts.service';

@Controller('admin/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query('page') page?: string) {
    return this.postsService.findAll(page);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
    }),
  )
  create(
    @Body() dto: CreatePostDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.postsService.create(dto, image);
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
    @Body() dto: UpdatePostDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.postsService.update(BigInt(id), dto, image);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(BigInt(id));
  }
}
