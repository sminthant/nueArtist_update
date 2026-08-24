import {
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    const ip = request.ip ?? 'unknown';

    return this.authService.login(dto, ip);
  }

  @Post('logout')
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
