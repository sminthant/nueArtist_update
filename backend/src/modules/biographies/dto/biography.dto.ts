import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateBiographyDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter a biography title.' })
  @MaxLength(255, {
    message: 'Biography title may not be longer than 255 characters.',
  })
  title!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter biography content.' })
  content!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Sort order must be a whole number.' })
  @Min(0, { message: 'Sort order must be 0 or greater.' })
  sort_order?: number;
}

export class UpdateBiographyDto extends CreateBiographyDto {}
