import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { toBoolean } from '../../../common/validators/transform-boolean.util';

export class CreateSampleLinkDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the name.' })
  @MaxLength(150, { message: 'Name may not be longer than 150 characters.' })
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the direct link.' })
  @IsUrl({}, { message: 'Please enter a valid URL.' })
  direct_link!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number.' })
  @Min(0, { message: 'Price must be 0 or greater.' })
  price!: number;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Order must be a whole number.' })
  @Min(0, { message: 'Order must be 0 or greater.' })
  order?: number;
}

export class UpdateSampleLinkDto extends CreateSampleLinkDto {}

export class ToggleSampleLinkDto {
  @Transform(({ value }) => toBoolean(value, false))
  @IsBoolean({ message: 'The is active field must be true or false.' })
  is_active!: boolean;
}

export class ReorderSampleLinksDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  order!: number[];
}
