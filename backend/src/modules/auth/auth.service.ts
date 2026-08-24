import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginRateLimiter: LoginRateLimiterService,
  ) {}

  async login(dto: LoginDto, ip: string): Promise<AuthTokens & { user: AuthUser }> {
    this.loginRateLimiter.ensureNotRateLimited(dto.email, ip);

    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      this.loginRateLimiter.recordFailedAttempt(dto.email, ip);

      throw new HttpException(
        {
          message: 'The given data was invalid.',
          errors: {
            email: ['These credentials do not match our records.'],
          },
        },
        422,
      );
    }

    this.loginRateLimiter.clearAttempts(dto.email, ip);

    const tokens = await this.issueTokens(user.id, user.email, user.role, dto.remember);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    return this.issueTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
      tokenRecord.user.role,
      true,
    );
  }

  async logout(userId: bigint): Promise<{ message: string }> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Logged out successfully.' };
  }

  me(user: AuthUser): AuthUser {
    return user;
  }

  private async issueTokens(
    userId: bigint,
    email: string,
    role: string,
    remember = false,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: userId.toString(),
      email,
      role,
    };

    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = remember
      ? this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')
      : '1d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'change-me'),
      expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresMs = this.parseDuration(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  private parseDuration(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration);

    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
      default:
        return value * 24 * 60 * 60 * 1000;
    }
  }
}
