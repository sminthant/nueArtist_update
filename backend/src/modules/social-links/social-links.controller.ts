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
} from '@nestjs/common';
import {
  CreateSocialLinkDto,
  UpdateSocialLinkDto,
} from './dto/social-link.dto';
import { SocialLinksService } from './social-links.service';

@Controller('admin/social-links')
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Get()
  findAll(@Query('page') page?: string) {
    return this.socialLinksService.findAll(page);
  }

  @Post()
  create(@Body() dto: CreateSocialLinkDto) {
    return this.socialLinksService.create(dto);
  }

  @Put(':id')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSocialLinkDto,
  ) {
    return this.socialLinksService.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.socialLinksService.remove(BigInt(id));
  }
}
