import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'The refresh token field is required.' })
  refreshToken!: string;
}
