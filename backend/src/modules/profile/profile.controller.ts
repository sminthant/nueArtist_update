import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
} from '@nestjs/common';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { DeleteProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@Controller('admin/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthUser) {
    return this.profileService.getProfile(user);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user, dto);
  }

  @Delete()
  deleteProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeleteProfileDto,
  ) {
    return this.profileService.deleteProfile(user, dto);
  }
}
