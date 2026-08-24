import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { DeleteProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  getProfile(user: AuthUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async updateProfile(user: AuthUser, dto: UpdateProfileDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing && existing.id !== user.id) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          email: ['The email has already been taken.'],
        },
      });
    }

    const updated = await this.usersService.updateProfile(user.id, {
      name: dto.name,
      email: dto.email,
    });

    return {
      message: 'Profile updated successfully.',
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
      },
    };
  }

  async deleteProfile(user: AuthUser, dto: DeleteProfileDto) {
    const account = await this.usersService.findById(user.id);

    if (!account || !(await bcrypt.compare(dto.password, account.password))) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: {
          password: ['The password is incorrect.'],
        },
      });
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await this.usersService.deleteUser(user.id);

    return { message: 'Account deleted successfully.' };
  }
}
