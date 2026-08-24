import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('home')
  getHome() {
    return this.publicService.getHome();
  }

  @Public()
  @Get('music')
  getMusic() {
    return this.publicService.getMusic();
  }

  @Public()
  @Get('artist-biographies')
  getArtistBiographies() {
    return this.publicService.getArtistBiographies();
  }

  @Public()
  @Get('artist-biographies/:id')
  getArtistBiography(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.getArtistBiography(BigInt(id));
  }
}
