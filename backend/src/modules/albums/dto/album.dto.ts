import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ALBUM_CATEGORIES } from '../../../common/constants/album-categories';
import { RequiredWithoutAll } from '../../../common/validators/required-without-all.validator';
import { toBoolean } from '../../../common/validators/transform-boolean.util';

export class CreateAlbumDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Please enter the album title.' })
  @MaxLength(255, { message: 'The title may not be longer than 255 characters.' })
  title!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Artist name may not be longer than 255 characters.' })
  artist_name?: string | null;

  @IsString({ message: 'Please select a music category.' })
  @IsIn(ALBUM_CATEGORIES, {
    message:
      'Music category must be Latest Releases, NUE, Label Releases, or Live sets.',
  })
  category!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid Spotify URL.' })
  @MaxLength(255)
  @RequiredWithoutAll(['soundcloud_url', 'youtube_url'])
  spotify_url?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid SoundCloud URL.' })
  @MaxLength(255)
  @RequiredWithoutAll(['spotify_url', 'youtube_url'])
  soundcloud_url?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value ?? null,
  )
  @IsOptional()
  @IsUrl({}, { message: 'Please enter a valid YouTube URL.' })
  @MaxLength(255)
  @RequiredWithoutAll(['spotify_url', 'soundcloud_url'])
  youtube_url?: string | null;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  @IsBoolean()
  is_published?: boolean;
}

export class UpdateAlbumDto extends CreateAlbumDto {}

export class ReorderAlbumsDto {
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  order!: number[];
}
