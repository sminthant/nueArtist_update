import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the post title.' })
  @MaxLength(255, { message: 'The title may not be longer than 255 characters.' })
  title!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value ?? ''),
  )
  @IsOptional()
  @IsString()
  content?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid social URL for Link 1.' })
  @MaxLength(255)
  social_link_1?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid social URL for Link 2.' })
  @MaxLength(255)
  social_link_2?: string | null;

  @IsString({ message: 'Please choose draft or published.' })
  @IsIn(['draft', 'published'], {
    message: 'Status must be draft or published.',
  })
  status!: 'draft' | 'published';

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    return value;
  })
  @IsOptional()
  @ValidateIf((object: CreatePostDto) => object.expire_at !== null)
  @IsDateString({}, { message: 'Please enter a valid date and time.' })
  expire_at?: string | null;
}

export class UpdatePostDto extends CreatePostDto {}
