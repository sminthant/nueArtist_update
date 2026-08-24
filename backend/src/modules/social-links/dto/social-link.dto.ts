import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { toBoolean } from '../../../common/validators/transform-boolean.util';

export class CreateSocialLinkDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the platform name.' })
  @MaxLength(255, {
    message: 'Platform name may not be longer than 255 characters.',
  })
  platform!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the social URL.' })
  @IsUrl({}, { message: 'Please enter a valid URL.' })
  @MaxLength(255, { message: 'URL may not be longer than 255 characters.' })
  url!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Icon may not be longer than 255 characters.' })
  icon?: string | null;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateSocialLinkDto extends CreateSocialLinkDto {}
